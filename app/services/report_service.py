"""
services/report_service.py

RBAC (Analytics column): Fleet Manager/Financial Analyst = read-only,
Dispatcher/Safety Officer = 403. Enforced at router level via
require_role(); this module has no auth awareness.

Aggregation scope (locked, see project discussion):
  - Fuel Efficiency / Fleet Utilization / Operational Cost / ROI ->
    per-vehicle, all-time, computed only from COMPLETED trips and
    ACTIVE+CLOSED maintenance logs (a maintenance record's cost counts
    the moment it's logged, regardless of open/closed state) and all
    FuelLog/Expense rows for that vehicle.
  - Monthly Revenue chart -> fleet-wide, grouped by
    Trip.completed_at's (year, month), summed across all COMPLETED trips.
  - Top Costliest Vehicles -> per-vehicle operational cost
    (maintenance cost sum + fuel cost sum), ranked descending.

Formulas:
  - fuel_efficiency (km/L) = sum(Trip.planned_distance over completed
    trips for that vehicle) / sum(FuelLog.liters for that vehicle).
    None if no fuel logged (avoid div-by-zero).
  - utilization (%) = count(completed trips for vehicle) /
    count(completed trips fleet-wide) * 100. None if fleet has zero
    completed trips.
  - operational_cost = sum(MaintenanceLog.cost for vehicle) +
    sum(FuelLog.cost for vehicle) + sum(Expense.amount for vehicle).
  - roi = (sum(Trip.revenue over completed trips for vehicle) -
    (maintenance_cost + fuel_cost)) / vehicle.acquisition_cost.
    None if acquisition_cost is 0 (avoid div-by-zero). Expenses
    (tolls/other) are NOT subtracted in ROI — only maintenance + fuel,
    matching the wireframe's stated formula literally.

All functions are read-only (no commits, no mutation).
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Vehicle, Trip, MaintenanceLog, FuelLog, Expense
from app.enums import TripStatus


def _completed_trip_count(db: Session, vehicle_id: int | None = None) -> int:
    q = db.query(func.count(Trip.id)).filter(Trip.status == TripStatus.COMPLETED)
    if vehicle_id is not None:
        q = q.filter(Trip.vehicle_id == vehicle_id)
    return q.scalar() or 0


def get_fuel_efficiency(db: Session) -> list[dict]:
    """km per liter, per vehicle. None if vehicle has no fuel logs."""
    vehicles = db.query(Vehicle).all()
    results = []
    for v in vehicles:
        distance = (
            db.query(func.coalesce(func.sum(Trip.planned_distance), 0.0))
            .filter(Trip.vehicle_id == v.id, Trip.status == TripStatus.COMPLETED)
            .scalar()
        )
        liters = (
            db.query(func.coalesce(func.sum(FuelLog.liters), 0.0))
            .filter(FuelLog.vehicle_id == v.id)
            .scalar()
        )
        efficiency = (distance / liters) if liters and liters > 0 else None
        results.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "distance": distance,
                "liters": liters,
                "km_per_liter": efficiency,
            }
        )
    return results


def get_fleet_utilization(db: Session) -> list[dict]:
    """% of fleet-wide completed trips attributable to each vehicle."""
    fleet_total = _completed_trip_count(db)
    vehicles = db.query(Vehicle).all()
    results = []
    for v in vehicles:
        vehicle_trips = _completed_trip_count(db, vehicle_id=v.id)
        utilization = (vehicle_trips / fleet_total * 100) if fleet_total > 0 else None
        results.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "completed_trips": vehicle_trips,
                "utilization_pct": utilization,
            }
        )
    return results


def _operational_cost_components(db: Session, vehicle_id: int) -> dict:
    maintenance_cost = (
        db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0.0))
        .filter(MaintenanceLog.vehicle_id == vehicle_id)
        .scalar()
    )
    fuel_cost = (
        db.query(func.coalesce(func.sum(FuelLog.cost), 0.0))
        .filter(FuelLog.vehicle_id == vehicle_id)
        .scalar()
    )
    expense_cost = (
        db.query(func.coalesce(func.sum(Expense.amount), 0.0))
        .filter(Expense.vehicle_id == vehicle_id)
        .scalar()
    )
    return {
        "maintenance_cost": maintenance_cost,
        "fuel_cost": fuel_cost,
        "expense_cost": expense_cost,
        "total": maintenance_cost + fuel_cost + expense_cost,
    }


def get_operational_cost(db: Session) -> list[dict]:
    vehicles = db.query(Vehicle).all()
    results = []
    for v in vehicles:
        costs = _operational_cost_components(db, v.id)
        results.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                **costs,
            }
        )
    return results


def get_vehicle_roi(db: Session) -> list[dict]:
    """ROI = (revenue - (maintenance + fuel)) / acquisition_cost.
    Expenses (tolls/other) excluded per locked formula."""
    vehicles = db.query(Vehicle).all()
    results = []
    for v in vehicles:
        revenue = (
            db.query(func.coalesce(func.sum(Trip.revenue), 0.0))
            .filter(Trip.vehicle_id == v.id, Trip.status == TripStatus.COMPLETED)
            .scalar()
        )
        maintenance_cost = (
            db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0.0))
            .filter(MaintenanceLog.vehicle_id == v.id)
            .scalar()
        )
        fuel_cost = (
            db.query(func.coalesce(func.sum(FuelLog.cost), 0.0))
            .filter(FuelLog.vehicle_id == v.id)
            .scalar()
        )
        roi = (
            (revenue - (maintenance_cost + fuel_cost)) / v.acquisition_cost
            if v.acquisition_cost and v.acquisition_cost > 0
            else None
        )
        results.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "revenue": revenue,
                "maintenance_cost": maintenance_cost,
                "fuel_cost": fuel_cost,
                "roi": roi,
            }
        )
    return results


def get_monthly_revenue(db: Session) -> list[dict]:
    """Fleet-wide revenue summed by (year, month) of Trip.completed_at."""
    rows = (
        db.query(
            func.extract("year", Trip.completed_at).label("year"),
            func.extract("month", Trip.completed_at).label("month"),
            func.coalesce(func.sum(Trip.revenue), 0.0).label("revenue"),
        )
        .filter(Trip.status == TripStatus.COMPLETED)
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    return [
        {"year": int(r.year), "month": int(r.month), "revenue": r.revenue}
        for r in rows
    ]


def get_top_costliest_vehicles(db: Session, limit: int = 5) -> list[dict]:
    """Vehicles ranked by (maintenance_cost + fuel_cost) descending."""
    vehicles = db.query(Vehicle).all()
    ranked = []
    for v in vehicles:
        costs = _operational_cost_components(db, v.id)
        ranked.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "operational_cost": costs["maintenance_cost"] + costs["fuel_cost"],
            }
        )
    ranked.sort(key=lambda r: r["operational_cost"], reverse=True)
    return ranked[:limit]


__all__ = [
    "get_fuel_efficiency",
    "get_fleet_utilization",
    "get_operational_cost",
    "get_vehicle_roi",
    "get_monthly_revenue",
    "get_top_costliest_vehicles",
]