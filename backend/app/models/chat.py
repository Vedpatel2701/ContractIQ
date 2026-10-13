import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    contract_id = Column(String, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=True, index=True)
    session_id = Column(String, nullable=True, index=True)
    role = Column(String, nullable=False) # user / assistant
    text = Column(Text, nullable=False)
    sources = Column(Text, nullable=True) # JSON serialized list of SourceItem dicts
    citations = Column(Text, nullable=True) # JSON serialized list of citation strings
    client_message_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    contract = relationship("Contract", back_populates="chat_messages")
    user = relationship("User")
