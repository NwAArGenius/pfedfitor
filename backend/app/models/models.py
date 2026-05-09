from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
import uuid

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = True
    documents: List["Document"] = Relationship(back_populates="owner")

class Document(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    filename: str
    original_path: str
    processed_path: Optional[str] = None
    file_size: int
    page_count: int
    status: str = "uploaded"  # uploaded, processing, ready, failed
    is_scanned: bool = False
    confidence: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    owner_id: uuid.UUID = Field(foreign_key="user.id")
    owner: User = Relationship(back_populates="documents")
    edits: List["Edit"] = Relationship(back_populates="document")

class Edit(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="document.id")
    document: Document = Relationship(back_populates="edits")
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
    user_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
