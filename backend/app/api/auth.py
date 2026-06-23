"""Authentication endpoints: register, login."""
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut
from app.services.auth_service import register_user, authenticate_user, build_token_for_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user = register_user(db, payload)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    token = build_token_for_user(user)
    return Token(access_token=token, user=user)


@router.post("/login/form", response_model=Token, include_in_schema=False)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Alternate login route compatible with the OAuth2 'password' flow (used by Swagger's Authorize button)."""
    user = authenticate_user(db, form_data.username, form_data.password)
    token = build_token_for_user(user)
    return Token(access_token=token, user=user)
