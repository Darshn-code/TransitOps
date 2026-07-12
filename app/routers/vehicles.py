"""
routers/vehicles.py

RBAC (Fleet column): Fleet Manager = CRUD, Dispatcher/Financial Analyst
= read-only, Safety Officer = 403.

No DELETE route, by design: the permission matrix lists DELETE = NO
for every role including Fleet Manager, and the wireframe has no
delete button — only "Retire Vehicle". Retiring is a status transition
(-> RETIRED), not a row deletion: the record, and all its trip/
maintenance/fuel/expense history, stays intact forever so Reports &
Analytics numbers don't break. Modeled as an action-specific POST
route, same pattern as Trip/MaintenanceLog status transitions, rather
than exposing `status` on the generic PATCH.

No un-retire route: the wireframe states retiring "cannot be undone
without Admin approval," and there is no Admin role anywhere in this
RBAC model — adding an un-retire endpoint would invent a permission
tier that doesn't exist in the spec. Omitted intentionally, not an
oversight; revisit if an Admin role gets added later.

Create/update are plain ORM writes here (no side effects on other
tables), unlike Trip/MaintenanceLog mutations — so no separate service
module was warranted; logic stays in the router per the "thin service
only when there's a business rule" pattern used elsewhere.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database import get_db
from app.enums import RoleEnum, VehicleStatus
from app.models import Vehicle
from app.schemas import VehicleCreate, VehicleOut, VehicleUpdate

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

_READ_ROLES = require_role(
    RoleEnum.FLEET_MANAGER, RoleEnum.DISPATCHER, RoleEnum.FINANCIAL_ANALYST
)
_WRITE_ROLE = require_role(RoleEnum.FLEET_MANAGER)


@router.get("", response_model=list[VehicleOut], dependencies=[Depends(_READ_ROLES)])
def list_vehicles(db: Session = Depends(get_db)) -> list[Vehicle]:
    return db.query(Vehicle).all()


@router.get(
    "/{vehicle_id}", response_model=VehicleOut, dependencies=[Depends(_READ_ROLES)]
)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    return vehicle


@router.post(
    "",
    response_model=VehicleOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_WRITE_ROLE)],
)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db)) -> Vehicle:
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration number '{data.registration_number}' already exists",
        )
    db.refresh(vehicle)
    return vehicle


@router.patch(
    "/{vehicle_id}", response_model=VehicleOut, dependencies=[Depends(_WRITE_ROLE)]
)
def update_vehicle(
    vehicle_id: int, data: VehicleUpdate, db: Session = Depends(get_db)
) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.post(
    "/{vehicle_id}/retire",
    response_model=VehicleOut,
    dependencies=[Depends(_WRITE_ROLE)],
)
def retire_vehicle(vehicle_id: int, db: Session = Depends(get_db)) -> Vehicle:
    """Status -> RETIRED. Permanently hidden from dispatch; history preserved.
    No un-retire route — see module docstring."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    if vehicle.status == VehicleStatus.RETIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is already retired",
        )

    vehicle.status = VehicleStatus.RETIRED

    db.commit()
    db.refresh(vehicle)
    return vehicle