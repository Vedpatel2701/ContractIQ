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
    db = SessionLocal()
    try:
        # 1. Seed Default Users (Development / Academic Demo Accounts)
        seed_users = [
            {"email": "admin@gmail.com", "old_email": "admin@contractiq.com", "full_name": "Admin User", "password": "admin123", "role": UserRole.ADMIN.value},
            {"email": "manager@gmail.com", "old_email": "manager@contractiq.com", "full_name": "Contract Manager", "password": "manager123", "role": UserRole.CONTRACT_MANAGER.value},
            {"email": "viewer@gmail.com", "old_email": "viewer@contractiq.com", "full_name": "Viewer User", "password": "viewer123", "role": UserRole.VIEWER.value},
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
                    db.commit()
                    db.refresh(user_obj)
            if not user_obj:
                hashed_pwd = hash_password(u["password"])
                user_obj = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    hashed_password=hashed_pwd,
                    role=u["role"]
                )
                db.add(user_obj)
                db.commit()
                db.refresh(user_obj)
            else:
                user_obj.hashed_password = hash_password(u["password"])
                user_obj.role = u["role"]
                db.commit()
                db.refresh(user_obj)

            if u["role"] == UserRole.ADMIN.value:
                admin_user_id = user_obj.id

        # 2. Ensure existing contracts are marked is_demo = True if no owner_id is set
        db.query(Contract).filter(Contract.owner_id == None).update({"is_demo": True}, synchronize_session=False)
        db.commit()

        # 3. Seed Initial Contracts
        if db.query(Contract).count() == 0:
            seed_contracts = [
                {
                    "id": "CON-1042",
                    "name": "Enterprise SaaS Agreement",
                    "contract_type": "Software license",
                    "company": "Northstar Labs",
                    "status": "Active",
                    "risk_level": "Low",
                    "start_date": "2024-03-12",
                    "expiry_date": "2026-09-14",
                    "renewal_date": "2026-08-28",
                    "notice_period": "30 days before renewal",
                    "payment_terms": "Annual subscription billed quarterly, net 30.",
                    "penalty_info": "Late payment fee of 1.5% per month after 30 days.",
                    "summary": "This agreement remains in good standing and is aligned with current commercial terms. The main action is to confirm the renewal notice window before the next cycle.",
                    "customer": "Northstar Labs",
                    "vendor": "ContractIQ Services",
                    "legal_owner": "Ved Patel",
                    "clauses": [
                        "Data processing obligations and confidentiality protections are clearly defined and aligned with customer policy.",
                        "Service level commitments include 99.9% uptime, incident response deadlines, and remediation timelines.",
                        "IP ownership remains with the customer for custom deliverables and implementation work created under the agreement.",
                        "Termination rights allow for a 30-day cure period before material breach escalation and service suspension."
                    ],
                    "risks": [
                        "No material legal exposure detected in standard commercial clauses.",
                        "Auto-renewal clause requires legal confirmation before the next renewal window."
                    ]
                },
                {
                    "id": "CON-1098",
                    "name": "Vendor Services Master Agreement",
                    "contract_type": "Services",
                    "company": "Apex Operations",
                    "status": "Review Required",
                    "risk_level": "High",
                    "start_date": "2023-11-20",
                    "expiry_date": "2026-11-05",
                    "renewal_date": "2026-10-22",
                    "notice_period": "60 days written notice",
                    "payment_terms": "Monthly retainer with milestone-based add-ons and net 45 terms.",
                    "penalty_info": "Termination for convenience requires 60 days written notice and payment for completed work.",
                    "summary": "The framework agreement has several commercial clauses that require review. The primary risk sits in liability and service credit terms, which should be clarified before renewal.",
                    "customer": "Apex Operations",
                    "vendor": "Northbridge Advisory",
                    "legal_owner": "Daniel Moreau",
                    "clauses": [
                        "Service credit thresholds are not aligned with business continuity requirements and require revision.",
                        "Indemnity language is broad and may require legal review before renewal and extension.",
                        "Audit rights are limited in a way that could reduce transparency and inhibit control testing."
                    ],
                    "risks": [
                        "Higher exposure around liability caps and indemnity language.",
                        "Penalty terms need review before final sign-off on renewal.",
                        "Three obligations are currently marked as missing or incomplete."
                    ]
                },
                {
                    "id": "CON-1120",
                    "name": "Manufacturing Supply Agreement",
                    "contract_type": "Procurement",
                    "company": "Vertex Manufacturing",
                    "status": "Active",
                    "risk_level": "Moderate",
                    "start_date": "2025-02-01",
                    "expiry_date": "2027-02-18",
                    "renewal_date": "2027-01-12",
                    "notice_period": "45 days before renewal",
                    "payment_terms": "Quarterly purchase commitments with price adjustment caps.",
                    "penalty_info": "Delivery delays may trigger liquidated damages up to 8% of the affected order value.",
                    "summary": "The agreement remains operationally healthy and commercially manageable. Performance tracking should continue, with a planned legal review ahead of the renewal cycle.",
                    "customer": "Vertex Manufacturing",
                    "vendor": "Helio Supply Co.",
                    "legal_owner": "Sofia Gupta",
                    "clauses": [
                        "Delivery obligations include milestone-based production schedules and contingency planning for supply disruptions.",
                        "Pricing escalation clauses are capped but need annual legal review before the next renewal cycle.",
                        "Quality assurance obligations are clear but should be confirmed at supplier level for all critical components."
                    ],
                    "risks": [
                        "Supplier performance risk is moderate due to seasonal demand fluctuations.",
                        "There is a review note on delivery schedule flexibility."
                    ]
                }
            ]

            for item in seed_contracts:
                clauses = item.pop("clauses")
                risks = item.pop("risks")
                item["is_demo"] = True
                item["owner_id"] = admin_user_id
                contract = Contract(**item)
                db.add(contract)
                db.commit()


                for c_text in clauses:
                    db.add(Clause(contract_id=contract.id, text=c_text))
                for r_text in risks:
                    db.add(RiskIndicator(contract_id=contract.id, description=r_text, severity=contract.risk_level))
                db.commit()
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
