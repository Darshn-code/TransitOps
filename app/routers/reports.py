"""
routers/reports.py

Page 8 — "Analytics" nav item / Reports & Analytics wireframe page.
(Named reports.py, not dashboard.py, to avoid colliding with Page 2's
"Dashboard" nav item — see routers/dashboard.py.)

RBAC (Analytics column): Fleet Manager + Financial Analyst = read-only,
Dispatcher/Safety Officer = 403. All six metrics are pure aggregation
queries already implemented in report_service.py (per-vehicle, all-time,
formulas locked in that module's docstring) — this router only wires
routes to require_role() and returns the service output directly.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database import get_db
from app.enums import RoleEnum
from app.services.report_service import (
    get_fleet_utilization,
    get_fuel_efficiency,
    get_monthly_revenue,
    get_operational_cost,
    get_top_costliest_vehicles,
    get_vehicle_roi,
)

router = APIRouter(prefix="/reports", tags=["reports"])

_ROLES = require_role(RoleEnum.FLEET_MANAGER, RoleEnum.FINANCIAL_ANALYST)


@router.get("/fuel-efficiency", dependencies=[Depends(_ROLES)])
def fuel_efficiency(db: Session = Depends(get_db)) -> list[dict]:
    return get_fuel_efficiency(db)


@router.get("/fleet-utilization", dependencies=[Depends(_ROLES)])
def fleet_utilization(db: Session = Depends(get_db)) -> list[dict]:
    return get_fleet_utilization(db)


@router.get("/operational-cost", dependencies=[Depends(_ROLES)])
def operational_cost(db: Session = Depends(get_db)) -> list[dict]:
    return get_operational_cost(db)


@router.get("/roi", dependencies=[Depends(_ROLES)])
def vehicle_roi(db: Session = Depends(get_db)) -> list[dict]:
    return get_vehicle_roi(db)


@router.get("/monthly-revenue", dependencies=[Depends(_ROLES)])
def monthly_revenue(db: Session = Depends(get_db)) -> list[dict]:
    return get_monthly_revenue(db)


@router.get("/top-costliest-vehicles", dependencies=[Depends(_ROLES)])
def top_costliest_vehicles(
    limit: int = Query(5, ge=1, le=50), db: Session = Depends(get_db)
) -> list[dict]:
    return get_top_costliest_vehicles(db, limit=limit)