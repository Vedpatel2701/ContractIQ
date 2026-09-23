from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: str
    role: str
    text: str
    citations: Optional[List[str]] = []
    created_at: Optional[datetime] = None

class MessageHistoryItem(BaseModel):
    id: str
    role: str
    text: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
