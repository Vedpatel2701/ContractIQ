from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification
from app.models.contract import Contract
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationUpdate
from app.services.notifications import generate_deadline_notifications
from app.api.deps import get_current_user, filter_authorized_contracts, verify_contract_access

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Automatically scan & refresh deadline notifications
    generate_deadline_notifications(db)
    
    # Filter notifications for contracts user is authorized to access
    authorized_contract_ids = [c.id for c in filter_authorized_contracts(db.query(Contract), current_user).all()]
    notifications = (
        db.query(Notification)
        .filter((Notification.contract_id.in_(authorized_contract_ids)) | (Notification.contract_id == None))
        .order_by(Notification.created_at.desc())
        .all()
    )
    return notifications

@router.patch("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: str,
    payload: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notif.contract_id:
        verify_contract_access(notif.contract_id, current_user, db)

    notif.is_read = payload.is_read
    db.commit()
    db.refresh(notif)
    return notif
