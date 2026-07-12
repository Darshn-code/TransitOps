"""
routers/maintenance.py

RBAC (Fleet column — covers both Vehicle Registry and Maintenance):
Fleet Manager = CRUD, Dispatcher/Financial Analyst = read-only,
Safety Officer = 403.

All mutation logic (vehicle.status side effects, already-in-shop /
retired / already-closed guards) lives in maintenance_service.py —
this file only wires routes to require_role() and the service
functions, same thin-router pattern as trips.py.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database import get_db
from app.enums import RoleEnum
from app.models import MaintenanceLog, User
from app.schemas import MaintenanceLogCloseIn, MaintenanceLogCreate, MaintenanceLogOut
from app.services.maintenance_service import close_maintenance_log, create_maintenance_log

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

_READ_ROLES = require_role(
    RoleEnum.FLEET_MANAGER, RoleEnum.DISPATCHER, RoleEnum.FINANCIAL_ANALYST
)
_WRITE_ROLE = require_role(RoleEnum.FLEET_MANAGER)


@router.get(
    "", response_model=list[MaintenanceLogOut], dependencies=[Depends(_READ_ROLES)]
)
def list_maintenance_logs(db: Session = Depends(get_db)) -> list[MaintenanceLog]:
    return db.query(MaintenanceLog).all()


@router.get(
    "/{log_id}",
    response_model=MaintenanceLogOut,
    dependencies=[Depends(_READ_ROLES)],
)
def get_maintenance_log(log_id: int, db: Session = Depends(get_db)) -> MaintenanceLog:
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found"
        )
    return log


@router.post(
    "", response_model=MaintenanceLogOut, status_code=status.HTTP_201_CREATED
)
def create_maintenance_log_route(
    data: MaintenanceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_WRITE_ROLE),
) -> MaintenanceLog:
    return create_maintenance_log(db, data, logged_by_user_id=current_user.id)


@router.post("/{log_id}/close", response_model=MaintenanceLogOut)
def close_maintenance_log_route(
    log_id: int,
    data: MaintenanceLogCloseIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(_WRITE_ROLE),
) -> MaintenanceLog:
    return close_maintenance_log(db, log_id)