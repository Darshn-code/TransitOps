"""
services/maintenance_service.py

RBAC (Fleet column): Fleet Manager = CRUD, Dispatcher/Financial Analyst =
read-only, Safety Officer = 403. Enforced at router level via require_role();
this module has no auth awareness.

Business rules (locked):
  - create: vehicle.status -> IN_SHOP. Blocked if vehicle already IN_SHOP
    (would double-flip / mask an existing open record) or RETIRED.
  - close: log.status -> CLOSED, closed_at -> now(). vehicle.status ->
    AVAILABLE, unless vehicle is RETIRED (retired vehicles never return to
    the dispatch pool regardless of maintenance state).
  - Blocked if the log is already CLOSED.

Both operations are single-transaction: log + vehicle updated together,
one commit, no partial state on failure.
"""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.enums import MaintenanceStatus, VehicleStatus
from app.models import MaintenanceLog, Vehicle
from app.schemas import MaintenanceLogCreate


def create_maintenance_log(
    db: Session, data: MaintenanceLogCreate, logged_by_user_id: int
) -> MaintenanceLog:
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    if vehicle.status == VehicleStatus.IN_SHOP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle already has an open maintenance record",
        )
    if vehicle.status == VehicleStatus.RETIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot log maintenance for a retired vehicle",
        )

    log = MaintenanceLog(
        vehicle_id=data.vehicle_id,
        description=data.description,
        cost=data.cost,
        status=MaintenanceStatus.ACTIVE,
        logged_by_user_id=logged_by_user_id,
    )
    vehicle.status = VehicleStatus.IN_SHOP

    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def close_maintenance_log(db: Session, log_id: int) -> MaintenanceLog:
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance log not found",
        )
    if log.status == MaintenanceStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance log is already closed",
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()

    log.status = MaintenanceStatus.CLOSED
    log.closed_at = datetime.utcnow()

    if vehicle is not None and vehicle.status != VehicleStatus.RETIRED:
        vehicle.status = VehicleStatus.AVAILABLE

    db.commit()
    db.refresh(log)
    return log


__all__ = ["create_maintenance_log", "close_maintenance_log"]