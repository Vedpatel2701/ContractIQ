from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SourceItem(BaseModel):
    contract_id: str
    document_name: str
    chunk_id: int
    page_number: Optional[int] = None
    section: Optional[str] = None
    excerpt: str
    file_url: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: str
    role: str
    text: str
    citations: Optional[List[str]] = []
    sources: Optional[List[SourceItem]] = []
    created_at: Optional[datetime] = None

class MessageHistoryItem(BaseModel):
    id: str
    role: str
    text: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
