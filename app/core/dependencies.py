"""
core/dependencies.py — get_current_user + require_role().

Distinct from database.py's get_db: this layer handles WHO is making the
request and WHETHER they're allowed to, built on top of the DB session
dependency rather than duplicating it.

All auth failures collapse to one generic 401 (bad signature, expired,
user not found, or is_active=False) — no granularity by design (locked
decision). is_active=False is the soft-delete mechanism for User: the
row and all its FKs (Trip.created_by_user_id, MaintenanceLog.logged_by_user_id)
stay intact forever; only the ability to authenticate is revoked.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import JWTError, decode_access_token
from app.database import get_db
from app.enums import RoleEnum
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise _CREDENTIALS_EXCEPTION
        user_id = int(user_id_str)
    except (JWTError, ValueError, TypeError):
        raise _CREDENTIALS_EXCEPTION

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise _CREDENTIALS_EXCEPTION

    return user


def require_role(*allowed: RoleEnum):
    """
    Route-level RBAC gate. Usage:

        @router.post("/vehicles", dependencies=[Depends(require_role(RoleEnum.FLEET_MANAGER))])

        @router.get(
            "/trips",
            dependencies=[Depends(require_role(
                RoleEnum.FLEET_MANAGER, RoleEnum.DISPATCHER, RoleEnum.FINANCIAL_ANALYST
            ))],
        )

    Checks the role embedded in the token (via get_current_user's DB-backed
    user), so a role change only takes effect after the current token
    expires and the user re-logs in — consistent with the no-revocation
    token model.
    """

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return _checker