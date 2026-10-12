from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.contract import Contract
from app.models.notification import Notification

def generate_deadline_notifications(db: Session) -> int:
    """
    Scans all contracts for actionable events (renewals, expiries, payment status, risk review)
    and generates clear notification records.
    """
    contracts = db.query(Contract).all()
    created_count = 0
    
    for c in contracts:
        # 1. Check high risk / review required contracts
        if c.risk_level in ["High", "Critical"] or c.status == "Review Required":
            existing = db.query(Notification).filter(
                Notification.contract_id == c.id,
                Notification.alert_type == "risk"
            ).first()
            if not existing:
                notif = Notification(
                    contract_id=c.id,
                    title=f"Legal Review Required: {c.name}",
                    description=f"Agreement with {c.company} has elevated risk factors ('{c.risk_level}') or requires explicit legal review.",
                    alert_type="risk"
                )
                db.add(notif)
                created_count += 1

        # 2. Check renewal date
        if c.renewal_date:
            existing_renewal = db.query(Notification).filter(
                Notification.contract_id == c.id,
                Notification.alert_type == "renewal"
            ).first()
            if not existing_renewal:
                notif = Notification(
                    contract_id=c.id,
                    title=f"Renewal Deadline Approaching: {c.name}",
                    description=f"Renewal scheduled for {c.renewal_date}. Notice window requirement: {c.notice_period or '30 days written notice'}.",
                    alert_type="renewal"
                )
                db.add(notif)
                created_count += 1

        # 3. Check Expiry
        if c.expiry_date or c.status == "Expired":
            existing_expiry = db.query(Notification).filter(
                Notification.contract_id == c.id,
                Notification.alert_type == "expiry"
            ).first()
            if not existing_expiry:
                is_expired = c.status == "Expired"
                title = f"Contract Expired: {c.name}" if is_expired else f"Contract Expiry Approaching: {c.name}"
                desc = f"Contract with {c.company} expired on {c.expiry_date}." if is_expired else f"Contract with {c.company} expires on {c.expiry_date}. Confirm extension terms."
                notif = Notification(
                    contract_id=c.id,
                    title=title,
                    description=desc,
                    alert_type="expiry"
                )
                db.add(notif)
                created_count += 1

        # 4. Check Payment status
        if c.payment_terms and ("overdue" in c.payment_terms.lower() or "due" in c.payment_terms.lower() or "penalty" in (c.penalty_info or "").lower()):
            existing_payment = db.query(Notification).filter(
                Notification.contract_id == c.id,
                Notification.alert_type == "payment"
            ).first()
            if not existing_payment:
                notif = Notification(
                    contract_id=c.id,
                    title=f"Payment / Invoicing Notice: {c.name}",
                    description=f"Commercial payment terms for {c.company}: {c.payment_terms}. {c.penalty_info or ''}",
                    alert_type="payment"
                )
                db.add(notif)
                created_count += 1
                
    if created_count > 0:
        db.commit()
        
    return created_count
