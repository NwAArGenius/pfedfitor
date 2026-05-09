from fastapi import Depends
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.models import User
from ..core.security import get_password_hash
import uuid

GUEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

def get_current_user(db: Session = Depends(get_session)) -> User:
    user = db.get(User, GUEST_USER_ID)
    if user is None:
        user = User(
            id=GUEST_USER_ID,
            email="guest@local",
            hashed_password=get_password_hash("disabled"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
