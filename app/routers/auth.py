"""
routers/auth.py

Single endpoint: POST /auth/login. Thin wrapper over auth_service.login —
all validation, error messages, and token creation already live there.
No other auth routes exist (no registration, no refresh, no logout —
locked decisions, see project notes).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import LoginIn, Token
from app.services.auth_service import login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login_route(credentials: LoginIn, db: Session = Depends(get_db)) -> Token:
    return login(db, credentials)