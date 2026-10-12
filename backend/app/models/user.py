import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CONTRACT_MANAGER = "CONTRACT_MANAGER"
    VIEWER = "VIEWER"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.CONTRACT_MANAGER.value, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
