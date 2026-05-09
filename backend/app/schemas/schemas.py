from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool

class DocumentRead(BaseModel):
    id: uuid.UUID
    filename: str
    file_size: int
    page_count: int
    status: str
    is_scanned: bool
    confidence: float
    created_at: datetime

class EditCreate(BaseModel):
    page_number: int
    edit_type: str  # text_replace, redact, highlight, annotation, stamp
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    x: float
    y: float
    width: float
    height: float
    font_size: Optional[int] = None
    color: Optional[str] = None

class EditRead(EditCreate):
    id: uuid.UUID
    document_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
