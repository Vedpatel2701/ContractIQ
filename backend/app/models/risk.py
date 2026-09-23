import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class RiskIndicator(Base):
    __tablename__ = "risk_indicators"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, default="Moderate") # Low, Moderate, High, Critical

    contract = relationship("Contract", back_populates="risk_indicators")
