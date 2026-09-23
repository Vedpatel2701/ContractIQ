import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_id():
    return f"CON-{uuid.uuid4().hex[:4].upper()}"

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, default=generate_id)
    name = Column(String, nullable=False, index=True)
    contract_type = Column(String, default="Commercial Agreement")
    company = Column(String, nullable=False, index=True)
    status = Column(String, default="Review Required", index=True) # Active, Review Required, Draft, Expired
    risk_level = Column(String, default="Not Assessed", index=True) # Low, Moderate, High, Critical, Not Assessed
    
    start_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    renewal_date = Column(String, nullable=True)
    notice_period = Column(String, nullable=True)
    payment_terms = Column(Text, nullable=True)
    penalty_info = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    
    # Party details
    customer = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    legal_owner = Column(String, nullable=True)
    
    # File details
    file_path = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    clauses = relationship("Clause", back_populates="contract", cascade="all, delete-orphan")
    risk_indicators = relationship("RiskIndicator", back_populates="contract", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="contract", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="contract", cascade="all, delete-orphan")
