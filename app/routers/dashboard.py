"""
routers/dashboard.py

Page 2 — "Dashboard" nav item (landing page, distinct from Page 8
"Analytics" — see routers/reports.py).

RBAC: no require_role() gate.

Filter semantics (vehicle_type / status / region — the 3 wireframe
dropdowns): applied only to vehicle-scoped numbers (Active/Available/
In-Maintenance vehicle counts, Fleet Utilization, Vehicle Status
breakdown), via query params of the same name. Active Trips, Pending
Trips, Drivers on Duty, and Recent Trips are NOT filtered by these —
trips/drivers have no vehicle_type/region field of their own, and
filtering them by their *assigned* vehicle's type/region was judged
out of scope for a single summary endpoint. Flag if per-filter trip/
driver scoping is actually wanted.

Metric definitions :
  - active_vehicles          = status != RETIRED
  - available_vehicles       = status == AVAILABLE
  - vehicles_in_maintenance  = status == IN_SHOP
  - active_trips             = status == DISPATCHED  ("on the road" now)
  - pending_trips            = status == DRAFT
  - drivers_on_duty          = status in (AVAILABLE, ON_TRIP)  -- i.e.
                                not OFF_DUTY and not SUSPENDED
  - fleet_utilization_pct    = (vehicles ON_TRIP) / (non-retired
                                vehicles) * 100, or null if zero
                                non-retired vehicles. NOTE: this is a
                                different formula from Page 8's
                                get_fleet_utilization (per-vehicle,
                                all-time, completed-trip-based) — same
                                English name, different metric, by
                                wireframe necessity (this one has to be
                                a single real-time fleet-wide %, not a
                                per-vehicle list).

Recent Trips: last 5 trips by created_at desc, across ALL statuses
(matches the wireframe's mixed Draft/Dispatched/Completed sample rows).
"Trip" column is rendered as f"TR{id:03d}" — display formatting only,
not a stored field. No ETA field exists anywhere in the Trip model, so
it is omitted from the response (wireframe shows one; needs a real
column, e.g. estimated_arrival, if required). 
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.enums import DriverStatus, TripStatus, VehicleStatus
from app.models import Driver, Trip, Vehicle

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", dependencies=[Depends(get_current_user)])
def dashboard_summary(
    vehicle_type: str | None = Query(None),
    status: VehicleStatus | None = Query(None),
    region: str | None = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    vehicle_q = db.query(Vehicle)
    if vehicle_type is not None:
        vehicle_q = vehicle_q.filter(Vehicle.type == vehicle_type)
    if status is not None:
        vehicle_q = vehicle_q.filter(Vehicle.status == status)
    if region is not None:
        vehicle_q = vehicle_q.filter(Vehicle.region == region)
    vehicles = vehicle_q.all()

    active_vehicles = [v for v in vehicles if v.status != VehicleStatus.RETIRED]
    available_vehicles = [v for v in vehicles if v.status == VehicleStatus.AVAILABLE]
    in_maintenance = [v for v in vehicles if v.status == VehicleStatus.IN_SHOP]
    on_trip = [v for v in vehicles if v.status == VehicleStatus.ON_TRIP]
    retired = [v for v in vehicles if v.status == VehicleStatus.RETIRED]

    fleet_utilization_pct = (
        (len(on_trip) / len(active_vehicles) * 100) if active_vehicles else None
    )

    active_trips = db.query(Trip).filter(Trip.status == TripStatus.DISPATCHED).count()
    pending_trips = db.query(Trip).filter(Trip.status == TripStatus.DRAFT).count()
    drivers_on_duty = (
        db.query(Driver)
        .filter(Driver.status.in_([DriverStatus.AVAILABLE, DriverStatus.ON_TRIP]))
        .count()
    )

    recent_trips = db.query(Trip).order_by(Trip.created_at.desc()).limit(5).all()
    recent_trips_out = [
        {
            "trip": f"TR{t.id:03d}",
            "vehicle": t.vehicle.registration_number,
            "driver": t.driver.name,
            "status": t.status,
        }
        for t in recent_trips
    ]

    return {
        "kpis": {
            "active_vehicles": len(active_vehicles),
            "available_vehicles": len(available_vehicles),
            "vehicles_in_maintenance": len(in_maintenance),
            "active_trips": active_trips,
            "pending_trips": pending_trips,
            "drivers_on_duty": drivers_on_duty,
            "fleet_utilization_pct": fleet_utilization_pct,
        },
        "recent_trips": recent_trips_out,
        "vehicle_status_breakdown": {
            "available": len(available_vehicles),
            "on_trip": len(on_trip),
            "in_shop": len(in_maintenance),
            "retired": len(retired),
        },
    }