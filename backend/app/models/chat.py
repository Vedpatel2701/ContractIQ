import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False) # user / assistant
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    contract = relationship("Contract", back_populates="chat_messages")
