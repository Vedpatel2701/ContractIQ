import re
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract
from app.models.clause import Clause
from app.models.risk import RiskIndicator
from app.models.user import User
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStats,
    ExecutiveOverview,
    SmartInsights,
    DeadlineItem
)
from app.api.deps import get_current_user, filter_authorized_contracts

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def parse_iso_date(date_str: Optional[str]) -> Optional[date]:
    """Safely extracts a valid YYYY-MM-DD date from arbitrary contract date strings."""
    if not date_str:
        return None
    cleaned = date_str.strip()
    if cleaned.lower() in ["none", "not applicable", "n/a", "unspecified", "null", ""]:
        return None
    match = re.search(r"\b(20\d\d-[01]\d-[0-3]\d)\b", cleaned)
    if match:
        try:
            return datetime.strptime(match.group(1), "%Y-%m-%d").date()
        except ValueError:
            pass
    return None

def compute_notice_deadline(notice_str: Optional[str], expiry_date: Optional[date]) -> Optional[date]:
    """Calculates or extracts explicit notice cutoff date based on notice terms and contract expiry."""
    if not notice_str:
        return None
    # 1. Check for explicit deadline date embedded in the text
    explicit_date = parse_iso_date(notice_str)
    if explicit_date:
        return explicit_date
    # 2. If notice period mentions N days, deduct from expiry_date
    if expiry_date:
        match = re.search(r"(\d+)\s*days?", notice_str.lower())
        if match:
            days = int(match.group(1))
            return expiry_date - timedelta(days=days)
    return None

@router.get("", response_model=DashboardResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contracts: List[Contract] = filter_authorized_contracts(db.query(Contract), current_user).all()
    today = date.today()

    total_contracts = len(contracts)
    active_contracts = sum(1 for c in contracts if c.status == "Active")
    review_required = sum(1 for c in contracts if c.status == "Review Required")
    draft_contracts = sum(1 for c in contracts if c.status == "Draft")
    expired_contracts = sum(1 for c in contracts if c.status == "Expired")
    high_risk_contracts = sum(1 for c in contracts if c.risk_level in ["High", "Critical"])

    # Distributions
    risk_distribution = {
        "Low": sum(1 for c in contracts if c.risk_level == "Low"),
        "Moderate": sum(1 for c in contracts if c.risk_level == "Moderate"),
        "High": sum(1 for c in contracts if c.risk_level == "High"),
        "Critical": sum(1 for c in contracts if c.risk_level == "Critical"),
        "Not Assessed": sum(1 for c in contracts if c.risk_level in [None, "Not Assessed", ""]),
    }

    status_distribution = {
        "Active": active_contracts,
        "Review Required": review_required,
        "Draft": draft_contracts,
        "Expired": expired_contracts,
    }

    category_counts: Dict[str, int] = {}
    for c in contracts:
        cat = c.contract_type or "Commercial Agreement"
        category_counts[cat] = category_counts.get(cat, 0) + 1

    # Extract all risk indicators for authorized contracts
    contract_ids = [c.id for c in contracts]
    risks_by_contract: Dict[str, List[str]] = {}
    if contract_ids:
        raw_risks = db.query(RiskIndicator).filter(RiskIndicator.contract_id.in_(contract_ids)).all()
        for r in raw_risks:
            risks_by_contract.setdefault(r.contract_id, []).append(r.description)

    # Compile Deadline Tracker Records
    deadlines: List[DeadlineItem] = []
    contracts_expiring_soon = 0
    upcoming_renewals = 0
    overdue_count = 0

    for c in contracts:
        exp_d = parse_iso_date(c.expiry_date)
        ren_d = parse_iso_date(c.renewal_date)
        c_risks = risks_by_contract.get(c.id, [])

        # 1. Expiry Deadline
        if exp_d:
            days = (exp_d - today).days
            if days < 0:
                status = "OVERDUE"
                urgency = "critical"
                overdue_count += 1
            elif days == 0:
                status = "DUE_TODAY"
                urgency = "critical"
            elif days <= 30:
                status = "URGENT"
                urgency = "high"
            elif days <= 90:
                status = "UPCOMING"
                urgency = "medium"
            else:
                status = "UPCOMING"
                urgency = "low"

            if 0 <= days <= 90:
                contracts_expiring_soon += 1

            deadlines.append(DeadlineItem(
                id=f"{c.id}-exp",
                contractId=c.id,
                contractName=c.name,
                contractType=c.contract_type or "Commercial Agreement",
                company=c.company,
                type="EXPIRY",
                typeLabel="Expiry Date",
                date=exp_d.strftime("%Y-%m-%d"),
                daysRemaining=days,
                status=status,
                urgency=urgency,
                action="Review term expiration; execute extension amendment or prepare contract transition.",
                riskLevel=c.risk_level or "Low",
                startDate=c.start_date,
                expiryDate=c.expiry_date,
                renewalDate=c.renewal_date,
                noticePeriod=c.notice_period,
                paymentTerms=c.payment_terms,
                penaltyInfo=c.penalty_info,
                summary=c.summary,
                riskIndicators=c_risks[:3]
            ))
        else:
            # Contract missing explicit term or expiration date
            deadlines.append(DeadlineItem(
                id=f"{c.id}-missing",
                contractId=c.id,
                contractName=c.name,
                contractType=c.contract_type or "Commercial Agreement",
                company=c.company,
                type="MISSING_DATE",
                typeLabel="Missing Date",
                date=None,
                daysRemaining=None,
                status="UNCLEAR",
                urgency="info",
                action="Contract term or expiry date is unspecified; conduct legal review to establish definite term.",
                riskLevel=c.risk_level or "Low",
                startDate=c.start_date,
                expiryDate=c.expiry_date,
                renewalDate=c.renewal_date,
                noticePeriod=c.notice_period,
                paymentTerms=c.payment_terms,
                penaltyInfo=c.penalty_info,
                summary=c.summary,
                riskIndicators=c_risks[:3]
            ))

        # 2. Renewal Deadline
        if ren_d:
            days = (ren_d - today).days
            if days < 0:
                status = "OVERDUE"
                urgency = "critical"
                overdue_count += 1
            elif days == 0:
                status = "DUE_TODAY"
                urgency = "critical"
            elif days <= 30:
                status = "URGENT"
                urgency = "high"
            elif days <= 90:
                status = "UPCOMING"
                urgency = "medium"
            else:
                status = "UPCOMING"
                urgency = "low"

            if days >= 0:
                upcoming_renewals += 1

            deadlines.append(DeadlineItem(
                id=f"{c.id}-ren",
                contractId=c.id,
                contractName=c.name,
                contractType=c.contract_type or "Commercial Agreement",
                company=c.company,
                type="RENEWAL",
                typeLabel="Renewal Date",
                date=ren_d.strftime("%Y-%m-%d"),
                daysRemaining=days,
                status=status,
                urgency=urgency,
                action="Evaluate vendor delivery performance and verify auto-renewal pricing terms.",
                riskLevel=c.risk_level or "Low",
                startDate=c.start_date,
                expiryDate=c.expiry_date,
                renewalDate=c.renewal_date,
                noticePeriod=c.notice_period,
                paymentTerms=c.payment_terms,
                penaltyInfo=c.penalty_info,
                summary=c.summary,
                riskIndicators=c_risks[:3]
            ))

        # 3. Notice Deadline
        notice_d = compute_notice_deadline(c.notice_period, exp_d)
        if notice_d:
            days = (notice_d - today).days
            if days < 0:
                status = "OVERDUE"
                urgency = "critical"
                overdue_count += 1
            elif days == 0:
                status = "DUE_TODAY"
                urgency = "critical"
            elif days <= 30:
                status = "URGENT"
                urgency = "high"
            elif days <= 90:
                status = "UPCOMING"
                urgency = "medium"
            else:
                status = "UPCOMING"
                urgency = "low"

            deadlines.append(DeadlineItem(
                id=f"{c.id}-not",
                contractId=c.id,
                contractName=c.name,
                contractType=c.contract_type or "Commercial Agreement",
                company=c.company,
                type="NOTICE",
                typeLabel="Notice Deadline",
                date=notice_d.strftime("%Y-%m-%d"),
                daysRemaining=days,
                status=status,
                urgency=urgency,
                action=f"Mandatory formal notice window: {c.notice_period or 'Serve written notice'}.",
                riskLevel=c.risk_level or "Low",
                startDate=c.start_date,
                expiryDate=c.expiry_date,
                renewalDate=c.renewal_date,
                noticePeriod=c.notice_period,
                paymentTerms=c.payment_terms,
                penaltyInfo=c.penalty_info,
                summary=c.summary,
                riskIndicators=c_risks[:3]
            ))

    # Build Smart AI Insights grounded in real stored contracts & risks
    high_risk_alerts = []
    for c in contracts:
        if c.risk_level in ["High", "Critical"]:
            c_risks = risks_by_contract.get(c.id, [])
            primary_issue = c_risks[0] if c_risks else f"Contract flagged with elevated {c.risk_level} risk score requiring legal review."
            high_risk_alerts.append({
                "contractId": c.id,
                "contractName": c.name,
                "company": c.company,
                "riskLevel": c.risk_level,
                "alert": primary_issue,
                "recommendation": f"Initiate renegotiation or add protective liability caps before {c.expiry_date or 'renewal'}."
            })

    upcoming_deadlines_insights = []
    # Find deadlines happening within next 90 days or overdue
    active_timed_deadlines = [d for d in deadlines if d.daysRemaining is not None]
    active_timed_deadlines.sort(key=lambda x: (x.daysRemaining if x.daysRemaining is not None else 9999))
    for d in active_timed_deadlines[:6]:
        upcoming_deadlines_insights.append({
            "contractId": d.contractId,
            "contractName": d.contractName,
            "company": d.company,
            "typeLabel": d.typeLabel,
            "date": d.date,
            "daysRemaining": d.daysRemaining,
            "status": d.status,
            "urgency": d.urgency,
            "action": d.action
        })

    missing_clauses = []
    for c in contracts:
        c_risks = risks_by_contract.get(c.id, [])
        is_missing_expiry = not parse_iso_date(c.expiry_date)
        
        # Check if any risk notes indicate missing or problematic clauses
        clause_concerns = [r for r in c_risks if any(kw in r.lower() for kw in ["indemn", "liabilit", "penalty", "holdover", "damages", "missing", "vague", "auto-renewal"])]

        if is_missing_expiry or clause_concerns:
            issue_summary = clause_concerns[0] if clause_concerns else "Indefinite contract duration without specified termination or expiry date."
            missing_clauses.append({
                "contractId": c.id,
                "contractName": c.name,
                "company": c.company,
                "issue": issue_summary,
                "category": "Indefinite Term" if is_missing_expiry else "High-Exposure Clause",
                "recommendedRemedy": "Draft formal addendum defining explicit term and liability safeguards."
            })

    actionable_recommendations = []
    # Combine top high-priority actions
    for d in active_timed_deadlines:
        if d.daysRemaining is not None and d.daysRemaining <= 30:
            urgency_text = f"OVERDUE by {abs(d.daysRemaining)} days" if d.daysRemaining < 0 else (
                "Due TODAY" if d.daysRemaining == 0 else f"{d.daysRemaining} days remaining"
            )
            actionable_recommendations.append({
                "contractId": d.contractId,
                "contractName": d.contractName,
                "company": d.company,
                "priority": "High" if d.daysRemaining <= 14 else "Medium",
                "timing": urgency_text,
                "recommendation": f"{d.typeLabel} alert: {d.action}"
            })
    # If fewer than 4, add governance recommendations for missing dates
    for c in contracts:
        if not parse_iso_date(c.expiry_date) and len(actionable_recommendations) < 5:
            actionable_recommendations.append({
                "contractId": c.id,
                "contractName": c.name,
                "company": c.company,
                "priority": "Medium",
                "timing": "Action Required",
                "recommendation": f"Establish definite contract duration and expiration date for {c.name}."
            })

    # Recent Activity (sorted by updated_at descending)
    recent_activity = [
        {
            "id": c.id,
            "title": c.name,
            "company": c.company,
            "status": c.status,
            "riskLevel": c.risk_level or "Low",
            "lastUpdated": c.updated_at.strftime("%Y-%m-%d") if c.updated_at else "Recently"
        }
        for c in sorted(contracts, key=lambda x: x.updated_at or x.created_at, reverse=True)[:5]
    ]

    executive_overview = ExecutiveOverview(
        totalContracts=total_contracts,
        activeContracts=active_contracts,
        contractsExpiringSoon=contracts_expiring_soon,
        upcomingRenewals=upcoming_renewals,
        overdueCount=overdue_count,
        reviewRequired=review_required,
        draftContracts=draft_contracts,
        expiredContracts=expired_contracts,
        highRiskContracts=high_risk_contracts,
        riskDistribution=risk_distribution,
        statusDistribution=status_distribution,
        categoryDistribution=category_counts
    )

    smart_insights = SmartInsights(
        highRiskAlerts=high_risk_alerts[:5],
        upcomingDeadlines=upcoming_deadlines_insights[:5],
        missingOrProblematicClauses=missing_clauses[:5],
        actionableRecommendations=actionable_recommendations[:5]
    )

    legacy_stats = DashboardStats(
        totalContracts=total_contracts,
        activeContracts=active_contracts,
        reviewRequired=review_required,
        draftContracts=draft_contracts,
        expiredContracts=expired_contracts,
        highRiskContracts=high_risk_contracts,
        renewalsDueNext90Days=upcoming_renewals,
        contractVisibility="100%",
        riskDistribution=risk_distribution,
        statusDistribution=status_distribution
    )

    return DashboardResponse(
        executiveOverview=executive_overview,
        smartInsights=smart_insights,
        deadlines=deadlines,
        recentActivity=recent_activity,
        stats=legacy_stats
    )
