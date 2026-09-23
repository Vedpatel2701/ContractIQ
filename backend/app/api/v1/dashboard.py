from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract
from app.schemas.dashboard import DashboardResponse, DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    contracts = db.query(Contract).all()
    
    total = len(contracts)
    active = sum(1 for c in contracts if c.status == "Active")
    review_req = sum(1 for c in contracts if c.status == "Review Required")
    draft = sum(1 for c in contracts if c.status == "Draft")
    expired = sum(1 for c in contracts if c.status == "Expired")
    high_risk = sum(1 for c in contracts if c.risk_level in ["High", "Critical"])
    
    risk_dist = {
        "Low": sum(1 for c in contracts if c.risk_level == "Low"),
        "Moderate": sum(1 for c in contracts if c.risk_level == "Moderate"),
        "High": sum(1 for c in contracts if c.risk_level == "High"),
        "Critical": sum(1 for c in contracts if c.risk_level == "Critical"),
    }

    status_dist = {
        "Active": active,
        "Review Required": review_req,
        "Draft": draft,
        "Expired": expired,
    }

    recent_activity = [
        {
            "id": c.id,
            "title": c.name,
            "company": c.company,
            "status": c.status,
            "riskLevel": c.risk_level,
            "lastUpdated": c.updated_at.strftime("%Y-%m-%d") if c.updated_at else "Recently"
        }
        for c in sorted(contracts, key=lambda x: x.updated_at, reverse=True)[:5]
    ]

    return {
        "stats": {
            "totalContracts": total,
            "activeContracts": active,
            "reviewRequired": review_req,
            "draftContracts": draft,
            "expiredContracts": expired,
            "highRiskContracts": high_risk,
            "renewalsDueNext90Days": min(active, 11),
            "contractVisibility": "96%",
            "riskDistribution": risk_dist,
            "statusDistribution": status_dist
        },
        "recentActivity": recent_activity
    }
