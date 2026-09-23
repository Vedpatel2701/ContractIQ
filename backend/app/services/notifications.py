from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.contract import Contract
from app.models.notification import Notification

def generate_deadline_notifications(db: Session) -> int:
    """
    Scans all contracts for upcoming renewals or expiries and creates notification records if not already generated.
    """
    contracts = db.query(Contract).all()
    created_count = 0
    
    for c in contracts:
        # Check high risk contracts
        if c.risk_level in ["High", "Critical"]:
            existing = db.query(Notification).filter(
                Notification.contract_id == c.id,
                Notification.alert_type == "risk"
            ).first()
            if not existing:
                notif = Notification(
                    contract_id=c.id,
                    title=f"High Risk Detected: {c.name}",
                    description=f"{c.company} agreement has elevated risk factors requiring legal sign-off.",
                    alert_type="risk"
                )
                db.add(notif)
                created_count += 1

        # Check renewal date
        if c.renewal_date:
            existing_renewal = db.query(Notification).filter(
                Notification.contract_id == c.id,
                Notification.alert_type == "renewal"
            ).first()
            if not existing_renewal:
                notif = Notification(
                    contract_id=c.id,
                    title=f"Renewal Notice Approaching: {c.name}",
                    description=f"Renewal deadline is scheduled for {c.renewal_date}. Notice window: {c.notice_period or '30 days'}.",
                    alert_type="renewal"
                )
                db.add(notif)
                created_count += 1
                
    if created_count > 0:
        db.commit()
        
    return created_count
