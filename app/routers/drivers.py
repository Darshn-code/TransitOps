"""
routers/drivers.py

RBAC (Drivers column, per confirmed permission matrix): Fleet Manager
AND Safety Officer = CRUD, Dispatcher/Financial Analyst = 403.

safety-score and status updates get their own routes/schemas
(DriverSafetyScoreUpdate, DriverStatusUpdate) rather than being folded
into the generic PATCH, per schemas.py's design notes — same "action-
specific schema" pattern used for Trip/MaintenanceLog. All four write
routes share the same role gate here since both allowed roles get full
access to all driver fields (no further split like Trips' Dispatcher-
only-vs-Safety-Officer-read applies within Drivers).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database import get_db
from app.enums import RoleEnum
from app.models import Driver
from app.schemas import (
    DriverCreate,
    DriverOut,
    DriverSafetyScoreUpdate,
    DriverStatusUpdate,
    DriverUpdate,
)

router = APIRouter(prefix="/drivers", tags=["drivers"])

_ROLES = require_role(RoleEnum.FLEET_MANAGER, RoleEnum.SAFETY_OFFICER)


@router.get("", response_model=list[DriverOut], dependencies=[Depends(_ROLES)])
def list_drivers(db: Session = Depends(get_db)) -> list[Driver]:
    return db.query(Driver).all()


@router.get("/{driver_id}", response_model=DriverOut, dependencies=[Depends(_ROLES)])
def get_driver(driver_id: int, db: Session = Depends(get_db)) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )
    return driver


@router.post(
    "",
    response_model=DriverOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_ROLES)],
)
def create_driver(data: DriverCreate, db: Session = Depends(get_db)) -> Driver:
    driver = Driver(**data.model_dump())
    db.add(driver)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"License number '{data.license_number}' already exists",
        )
    db.refresh(driver)
    return driver


def _get_driver_or_404(driver_id: int, db: Session) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )
    return driver


@router.patch("/{driver_id}", response_model=DriverOut, dependencies=[Depends(_ROLES)])
def update_driver(
    driver_id: int, data: DriverUpdate, db: Session = Depends(get_db)
) -> Driver:
    driver = _get_driver_or_404(driver_id, db)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"License number '{data.license_number}' already exists",
        )
    db.refresh(driver)
    return driver


@router.patch(
    "/{driver_id}/safety-score",
    response_model=DriverOut,
    dependencies=[Depends(_ROLES)],
)
def update_safety_score(
    driver_id: int, data: DriverSafetyScoreUpdate, db: Session = Depends(get_db)
) -> Driver:
    driver = _get_driver_or_404(driver_id, db)
    driver.safety_score = data.safety_score
    db.commit()
    db.refresh(driver)
    return driver


@router.patch(
    "/{driver_id}/status", response_model=DriverOut, dependencies=[Depends(_ROLES)]
)
def update_driver_status(
    driver_id: int, data: DriverStatusUpdate, db: Session = Depends(get_db)
) -> Driver:
    driver = _get_driver_or_404(driver_id, db)
    driver.status = data.status
    db.commit()
    db.refresh(driver)
    return driver