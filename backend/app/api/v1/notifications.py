from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationUpdate
from app.services.notifications import generate_deadline_notifications

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    # Automatically scan & refresh deadline notifications
    generate_deadline_notifications(db)
    notifications = db.query(Notification).order_by(Notification.created_at.desc()).all()
    return notifications

@router.patch("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: str,
    payload: NotificationUpdate,
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = payload.is_read
    db.commit()
    db.refresh(notif)
    return notif
