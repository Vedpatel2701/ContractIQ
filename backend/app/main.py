from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models import Contract, Clause, RiskIndicator, Notification
from app.api.v1 import api_v1_router

def init_db():
    """Initializes tables and seeds initial contracts if database is empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
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
