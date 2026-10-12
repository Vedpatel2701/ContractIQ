import uuid
from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ContractChunk(Base):
    __tablename__ = "contract_chunks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    
    # Real embedding vector stored in PostgreSQL as JSON array of floats
    embedding = Column(JSON, nullable=True)

    contract = relationship("Contract", back_populates="chunks")
