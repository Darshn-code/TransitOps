"""
services/trip_service.py

RBAC: Trips column -> Dispatcher = CRUD, Safety Officer = read-only,
Fleet Manager/Financial Analyst = 403. Enforced at router level.

Business rules (locked):
  - cargo_weight <= vehicle.max_load_capacity is checked at CREATE time
    (fail fast — matches wireframe's live-validation-before-dispatch UI).
    Nothing capacity-related is re-checked at dispatch.
  - dispatch: trip must be DRAFT; vehicle must be AVAILABLE; driver must
    be AVAILABLE; driver's license must not be expired. On pass:
    trip->DISPATCHED, vehicle->ON_TRIP, driver->ON_TRIP, dispatched_at=now().
  - complete: trip must be DISPATCHED. trip->COMPLETED, completed_at=now(),
    final_odometer/fuel_consumed stored on trip. vehicle->AVAILABLE,
    vehicle.odometer updated. driver->AVAILABLE. Auto-creates a FuelLog
    row (vehicle_id, liters=fuel_consumed, cost=fuel_cost).
  - cancel: allowed from DRAFT or DISPATCHED (not COMPLETED/CANCELLED).
    From DRAFT, vehicle/driver were never flipped, so nothing to restore.
    From DISPATCHED, vehicle & driver -> AVAILABLE.

All mutations are single-transaction (one commit per operation).
"""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.enums import DriverStatus, TripStatus, VehicleStatus
from app.models import Driver, FuelLog, Trip, Vehicle
from app.schemas import TripCancelIn, TripCompleteIn, TripCreate


def create_trip(db: Session, data: TripCreate, created_by_user_id: int) -> Trip:
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    driver = db.query(Driver).filter(Driver.id == data.driver_id).first()
    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    if data.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cargo weight {data.cargo_weight}kg exceeds vehicle capacity "
                f"{vehicle.max_load_capacity}kg"
            ),
        )

    trip = Trip(
        source=data.source,
        destination=data.destination,
        vehicle_id=data.vehicle_id,
        driver_id=data.driver_id,
        cargo_weight=data.cargo_weight,
        planned_distance=data.planned_distance,
        status=TripStatus.DRAFT,
        created_by_user_id=created_by_user_id,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def dispatch_trip(db: Session, trip_id: int) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found"
        )
    if trip.status != TripStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft trips can be dispatched",
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if vehicle is None or vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is not available",
        )
    if driver is None or driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver is not available",
        )
    if driver.license_expiry_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver's license has expired",
        )

    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.utcnow()
    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP

    db.commit()
    db.refresh(trip)
    return trip


def complete_trip(db: Session, trip_id: int, data: TripCompleteIn) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found"
        )
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Dispatched trips can be completed",
        )

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.utcnow()
    trip.final_odometer = data.final_odometer
    trip.fuel_consumed = data.fuel_consumed

    if vehicle is not None:
        vehicle.status = VehicleStatus.AVAILABLE
        vehicle.odometer = data.final_odometer
    if driver is not None:
        driver.status = DriverStatus.AVAILABLE

    fuel_log = FuelLog(
        vehicle_id=trip.vehicle_id,
        liters=data.fuel_consumed,
        cost=data.fuel_cost,
    )
    db.add(fuel_log)

    db.commit()
    db.refresh(trip)
    return trip


def cancel_trip(db: Session, trip_id: int, data: TripCancelIn) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found"
        )
    if trip.status not in (TripStatus.DRAFT, TripStatus.DISPATCHED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft or Dispatched trips can be cancelled",
        )

    if trip.status == TripStatus.DISPATCHED:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        if vehicle is not None:
            vehicle.status = VehicleStatus.AVAILABLE
        if driver is not None:
            driver.status = DriverStatus.AVAILABLE

    trip.status = TripStatus.CANCELLED

    db.commit()
    db.refresh(trip)
    return trip


__all__ = ["create_trip", "dispatch_trip", "complete_trip", "cancel_trip"]