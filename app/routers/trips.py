"""
routers/trips.py

RBAC (Trips column): Dispatcher = CRUD, Safety Officer = read-only,
Fleet Manager/Financial Analyst = 403. All mutation logic (status
transitions, vehicle/driver side effects, capacity checks) lives in
trip_service.py — this file only wires routes to require_role() and
the service functions, and maps the authenticated user's id into
create_trip's created_by_user_id.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database import get_db
from app.enums import RoleEnum
from app.models import Trip, User
from app.schemas import (
    TripCancelIn,
    TripCompleteIn,
    TripCreate,
    TripDispatchIn,
    TripOut,
)
from app.services.trip_service import cancel_trip, complete_trip, create_trip, dispatch_trip

router = APIRouter(prefix="/trips", tags=["trips"])

_READ_ROLES = require_role(RoleEnum.DISPATCHER, RoleEnum.SAFETY_OFFICER)
_WRITE_ROLE = require_role(RoleEnum.DISPATCHER)


@router.get("", response_model=list[TripOut], dependencies=[Depends(_READ_ROLES)])
def list_trips(db: Session = Depends(get_db)) -> list[Trip]:
    return db.query(Trip).all()


@router.get("/{trip_id}", response_model=TripOut, dependencies=[Depends(_READ_ROLES)])
def get_trip(trip_id: int, db: Session = Depends(get_db)) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found"
        )
    return trip


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip_route(
    data: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_WRITE_ROLE),
) -> Trip:
    return create_trip(db, data, created_by_user_id=current_user.id)


@router.post("/{trip_id}/dispatch", response_model=TripOut)
def dispatch_trip_route(
    trip_id: int,
    data: TripDispatchIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(_WRITE_ROLE),
) -> Trip:
    return dispatch_trip(db, trip_id)


@router.post("/{trip_id}/complete", response_model=TripOut)
def complete_trip_route(
    trip_id: int,
    data: TripCompleteIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(_WRITE_ROLE),
) -> Trip:
    return complete_trip(db, trip_id, data)


@router.post("/{trip_id}/cancel", response_model=TripOut)
def cancel_trip_route(
    trip_id: int,
    data: TripCancelIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(_WRITE_ROLE),
) -> Trip:
    return cancel_trip(db, trip_id, data)