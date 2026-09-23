from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    contract_id: Optional[str] = None
    title: str
    description: str
    alert_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    is_read: bool
