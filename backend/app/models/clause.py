import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class Clause(Base):
    __tablename__ = "clauses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    clause_type = Column(String, nullable=True) # Termination, Indemnity, Liability, Confidentiality, etc.
    text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)

    contract = relationship("Contract", back_populates="clauses")
