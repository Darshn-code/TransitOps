"""
services/auth_service.py

No registration endpoint — all Users are preseeded directly into the DB
(seed script), never created via the API. This module only handles login.

Login takes email, password, AND role (the role dropdown on the login page)
because the DB still stores a single User.role — there's no multi-role
account model. All three must match the same row, or the caller finds out
exactly which part failed:

  - no user with that email at all         -> "No user with email '{email}'"
  - user exists, but not in the chosen role -> "No {role} with email '{email}'"
  - user exists, role matches, bad password -> "Incorrect email or password"
  - user exists, role+password fine, inactive -> "Account is inactive"

This is intentionally more specific than get_current_user's generic 401 —
acceptable for this hackathon's threat model, but worth knowing it leaks
whether an email exists in the system.

auth_service raises HTTPException directly (unlike other services, which
should stay framework-agnostic and raise domain exceptions) because auth
failure has no business meaning beyond the HTTP response — same pattern
as core/dependencies.py.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models import User
from app.schemas import LoginIn, Token


def login(db: Session, credentials: LoginIn) -> Token:
    user = db.query(User).filter(User.email == credentials.email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"No user with email '{credentials.email}'",
        )

    if user.role != credentials.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"No {credentials.role.value} with email '{credentials.email}'",
        )

    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive",
        )

    access_token = create_access_token(user_id=user.id, role=user.role)
    return Token(access_token=access_token, token_type="bearer")