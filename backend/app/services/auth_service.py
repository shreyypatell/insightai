"""Business logic for user registration and login."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database.models import User
from app.schemas.auth import UserRegister
from app.utils.security import hash_password, verify_password, create_access_token


def register_user(db: Session, payload: UserRegister) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


def build_token_for_user(user: User) -> str:
    return create_access_token({"sub": str(user.id)})
