from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1)
    role: Optional[UserRole] = UserRole.CONTRACT_MANAGER

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RoleUpdate(BaseModel):
    role: UserRole
