"""
core/security.py — password hashing + JWT encode/decode.

No refresh tokens, no revocation/blacklist table (locked decision).
Token payload carries: sub (user id, str), role (RoleEnum value), exp.
Embedding role means a role change won't take effect until the user's
current token expires and they re-login — acceptable given the no-
revocation model.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.enums import RoleEnum

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, role: RoleEnum) -> str:
    """Issues a single-use access token. No refresh token is ever created."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Raises jose.JWTError on any failure (bad signature, expired, malformed).
    Caller (dependencies.py) is responsible for turning that into a 401.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "JWTError",
]