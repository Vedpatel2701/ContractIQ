import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text, func
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models import Contract, Clause, RiskIndicator, Notification, User, UserRole
from app.core.security import hash_password, verify_password
from app.api.v1 import api_v1_router

logger = logging.getLogger(__name__)


def init_db():
    """Initializes tables, applies schema additions, and conditionally seeds development demo data."""
    # Ensure all tables exist in the target database
    Base.metadata.create_all(bind=engine)

    # SQLite does not apply new ORM columns to an existing local database; PostgreSQL needs safe column additions.
    existing_columns = {column["name"] for column in inspect(engine).get_columns("contracts")}
    migrations = {
        "payment_status": "VARCHAR DEFAULT 'Paid'",
        "is_demo": "BOOLEAN DEFAULT FALSE",
        "owner_id": "VARCHAR",
    }
    with engine.begin() as connection:
        for name, definition in migrations.items():
            if name not in existing_columns:
                connection.execute(text(f"ALTER TABLE contracts ADD COLUMN {name} {definition}"))

    existing_notif_columns = {column["name"] for column in inspect(engine).get_columns("notifications")}
    notif_migrations = {
        "deadline_type": "VARCHAR",
        "deadline_date": "VARCHAR",
        "reminder_interval": "VARCHAR",
        "status": "VARCHAR DEFAULT 'UPCOMING'",
        "dedup_key": "VARCHAR",
    }
    with engine.begin() as connection:
        for name, definition in notif_migrations.items():
            if name not in existing_notif_columns:
                connection.execute(text(f"ALTER TABLE notifications ADD COLUMN {name} {definition}"))

    # Chat Messages migration
    existing_chat_columns = {column["name"] for column in inspect(engine).get_columns("chat_messages")}
    chat_migrations = {
        "user_id": "VARCHAR",
        "session_id": "VARCHAR",
        "sources": "TEXT",
        "citations": "TEXT",
        "client_message_id": "VARCHAR",
    }
    with engine.begin() as connection:
        for name, definition in chat_migrations.items():
            if name not in existing_chat_columns:
                connection.execute(text(f"ALTER TABLE chat_messages ADD COLUMN {name} {definition}"))
        if not settings.DATABASE_URL.startswith("sqlite"):
            try:
                connection.execute(text("ALTER TABLE chat_messages ALTER COLUMN contract_id DROP NOT NULL;"))
            except Exception:
                pass

    # Users table migration
    existing_user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    user_migrations = {
        "can_delete": "BOOLEAN DEFAULT FALSE",
    }
    with engine.begin() as connection:
        for name, definition in user_migrations.items():
            if name not in existing_user_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {name} {definition}"))

    # Initialize initial accounts and demo contracts (creates accounts if missing, preserves existing records)
    db = SessionLocal()
    try:
        seed_users = [
            {"email": "admin@gmail.com", "old_email": "admin@contractiq.com", "full_name": "Admin User", "password": "admin123", "role": UserRole.ADMIN.value, "can_delete": True},
            {"email": "manager@gmail.com", "old_email": "manager@contractiq.com", "full_name": "Contract Manager", "password": "manager123", "role": UserRole.CONTRACT_MANAGER.value, "can_delete": False},
            {"email": "viewer@gmail.com", "old_email": "viewer@contractiq.com", "full_name": "Viewer User", "password": "viewer123", "role": UserRole.VIEWER.value, "can_delete": False},
        ]
        admin_user_id = None
        for u in seed_users:
            email_lower = u["email"].lower().strip()
            user_obj = db.query(User).filter(func.lower(User.email) == email_lower).first()
            if not user_obj and u.get("old_email"):
                old_email_lower = u["old_email"].lower().strip()
                user_obj = db.query(User).filter(func.lower(User.email) == old_email_lower).first()
                if user_obj:
                    user_obj.email = email_lower
                    user_obj.full_name = u["full_name"]
                    db.commit()
                    db.refresh(user_obj)
            if not user_obj:
                hashed_pwd = hash_password(u["password"])
                user_obj = User(
                    email=email_lower,
                    full_name=u["full_name"],
                    hashed_password=hashed_pwd,
                    role=u["role"],
                    can_delete=u.get("can_delete", False)
                )
                db.add(user_obj)
                db.commit()
                db.refresh(user_obj)
                logger.info(f"[Database Seed] Initialized demo account: {email_lower} ({u['role']})")
            else:
                # Ensure demo account has valid password hash and role
                if not user_obj.hashed_password or not verify_password(u["password"], user_obj.hashed_password):
                    user_obj.hashed_password = hash_password(u["password"])
                    user_obj.role = u["role"]
                    user_obj.can_delete = u.get("can_delete", False)
                    db.commit()
                    db.refresh(user_obj)
                    logger.info(f"[Database Seed] Synchronized demo credentials: {email_lower}")

            if u["role"] == UserRole.ADMIN.value:
                admin_user_id = user_obj.id

        if admin_user_id:
            try:
                db.execute(text("UPDATE chat_messages SET user_id = :aid WHERE user_id IS NULL"), {"aid": admin_user_id})
                db.commit()
            except Exception:
                db.rollback()

        # Seed / Synchronize Canonical Demo Contracts idempotently
        try:
            from app.services.seed_data import seed_demo_contracts
            seed_demo_contracts(db, admin_user_id)
        except Exception as seed_err:
            logger.warning(f"[Database Seed Notice] Demo contracts sync notice: {seed_err}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Enforce strict configuration validation in production (SECRET_KEY, PostgreSQL DATABASE_URL)
    settings.validate_production_configuration()

    # 2. Test database connection liveness before accepting requests
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("[Database] Connection successfully verified on startup.")
    except Exception as exc:
        logger.critical(f"[Database Error] Failed to connect to database during startup: {exc}")
        raise RuntimeError(
            f"Fatal startup error: Unable to connect to the database. Verify DATABASE_URL. Error: {exc}"
        ) from exc

    # 3. Apply schema migrations safely and initialize data
    init_db()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration: dynamically adapts to production domain(s) or development localhost
cors_origins = settings.parsed_cors_origins
has_wildcard = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if has_wildcard else cors_origins,
    allow_credentials=False if has_wildcard else True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# Include API v1 router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to ContractIQ API",
        "docs": "/docs",
        "version": settings.VERSION
    }


@app.get("/health")
def health_check():
    """Health check endpoint used by Render and Docker probes."""
    return {
        "status": "healthy",
        "version": settings.VERSION
    }
