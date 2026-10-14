from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models import Contract, Clause, RiskIndicator, Notification, User, UserRole
from app.core.security import hash_password
from app.api.v1 import api_v1_router


def init_db():
    """Initializes tables, seed users, and initial contracts if database is empty."""
    Base.metadata.create_all(bind=engine)
    # SQLite does not apply new ORM columns to an existing local database.
    existing_columns = {column["name"] for column in inspect(engine).get_columns("contracts")}
    migrations = {
        "payment_status": "VARCHAR DEFAULT 'Paid'",
        "is_demo": "BOOLEAN DEFAULT 0",
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

    db = SessionLocal()
    try:
        # 1. Seed Default Users (Development / Academic Demo Accounts)
        seed_users = [
            {"email": "admin@gmail.com", "old_email": "admin@contractiq.com", "full_name": "Admin User", "password": "admin123", "role": UserRole.ADMIN.value, "can_delete": True},
            {"email": "manager@gmail.com", "old_email": "manager@contractiq.com", "full_name": "Contract Manager", "password": "manager123", "role": UserRole.CONTRACT_MANAGER.value, "can_delete": False},
            {"email": "viewer@gmail.com", "old_email": "viewer@contractiq.com", "full_name": "Viewer User", "password": "viewer123", "role": UserRole.VIEWER.value, "can_delete": False},
        ]
        admin_user_id = None
        for u in seed_users:
            user_obj = db.query(User).filter(User.email == u["email"]).first()
            if not user_obj and u.get("old_email"):
                user_obj = db.query(User).filter(User.email == u["old_email"]).first()
                if user_obj:
                    user_obj.email = u["email"]
                    user_obj.full_name = u["full_name"]
                    user_obj.hashed_password = hash_password(u["password"])
                    user_obj.role = u["role"]
                    user_obj.can_delete = u.get("can_delete", False)
                    db.commit()
                    db.refresh(user_obj)
            if not user_obj:
                hashed_pwd = hash_password(u["password"])
                user_obj = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    hashed_password=hashed_pwd,
                    role=u["role"],
                    can_delete=u.get("can_delete", False)
                )
                db.add(user_obj)
                db.commit()
                db.refresh(user_obj)
            else:
                user_obj.hashed_password = hash_password(u["password"])
                user_obj.role = u["role"]
                user_obj.can_delete = u.get("can_delete", False)
                db.commit()
                db.refresh(user_obj)

            if u["role"] == UserRole.ADMIN.value:
                admin_user_id = user_obj.id

        if admin_user_id:
            try:
                db.execute(text("UPDATE chat_messages SET user_id = :aid WHERE user_id IS NULL"), {"aid": admin_user_id})
                db.commit()
            except Exception:
                db.rollback()

        # 2. Seed / Synchronize Canonical Demo Contracts idempotently
        from app.services.seed_data import seed_demo_contracts
        seed_demo_contracts(db, admin_user_id)
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"status": "healthy"}
