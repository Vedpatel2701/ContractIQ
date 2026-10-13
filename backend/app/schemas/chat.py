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
    client_message_id: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    role: str
    text: str
    citations: Optional[List[str]] = []
    sources: Optional[List[SourceItem]] = []
    show_sources: bool = False
    created_at: Optional[datetime] = None

class MessageHistoryItem(BaseModel):
    id: str
    role: str
    text: str
    citations: Optional[List[str]] = []
    sources: Optional[List[SourceItem]] = []
    show_sources: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
