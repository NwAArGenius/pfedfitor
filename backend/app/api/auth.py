from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta
from ..core.database import get_session
from ..core.security import create_access_token, verify_password, get_password_hash
from ..core.config import settings
from ..models.models import User
from ..schemas.schemas import UserCreate, UserRead, UserBase
import uuid

router = APIRouter()

@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_session)):
    statement = select(User).where(User.email == user_in.email)
    user = db.exec(statement).first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
def login(db: Session = Depends(get_session), form_data: OAuth2PasswordRequestForm = Depends()):
    statement = select(User).where(User.email == form_data.username)
    user = db.exec(statement).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(user.id, expires_delta=access_token_expires)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email
        }
    }
