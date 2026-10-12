import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    alert_type = Column(String, default="renewal", index=True) # renewal, risk, review, expiry, notice
    
    # Enhanced deadline & lifecycle tracking
    deadline_type = Column(String, nullable=True, index=True) # EXPIRATION, RENEWAL, NOTICE_DEADLINE, RISK_REVIEW, PAYMENT
    deadline_date = Column(String, nullable=True, index=True) # YYYY-MM-DD
    reminder_interval = Column(String, nullable=True) # 30_DAYS, 7_DAYS, 1_DAY, ON_DAY, OVERDUE, GENERAL
    status = Column(String, default="UPCOMING", index=True) # UPCOMING, DUE_TODAY, OVERDUE, ACTION_REQUIRED
    dedup_key = Column(String, unique=True, index=True, nullable=True) # Unique key for deduplication
    
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    contract = relationship("Contract", back_populates="notifications")
