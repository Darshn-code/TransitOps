"""
TransitOps — Pydantic v2 schemas

Design notes (see project discussion):
- Hybrid strictness: fields with no status/relationship/business-rule
  implication use generic partial Update schemas. Fields that drive a
  state transition or a side effect on another table are NEVER exposed
  on a generic update — they only move through action-specific schemas
  tied 1:1 to a service function (dispatch_trip, complete_trip, etc).
- Enum reuse: enums.py types are used directly as field types. Pydantic
  v2 validates incoming strings against them and serializes back to the
  string value automatically — no duplicate enum definitions needed.
- RBAC on reads: a single Out schema per entity. Role-based field hiding
  (e.g. Dispatcher shouldn't see acquisition_cost) is done by stripping
  keys from the serialized dict in the service/router layer, not via
  separate per-role Out schemas.
- created_at/id/audit fields are always server-assigned -> never present
  on Create schemas.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.enums import (
    RoleEnum,
    VehicleStatus,
    DriverStatus,
    TripStatus,
    MaintenanceStatus,
    ExpenseType,
)


# A shared base so every Out schema can read straight from ORM objects
# (SQLAlchemy model instances), not just dicts.
class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    name: str = Field(..., max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8)  # plaintext in; hashed in service layer
    role: RoleEnum


class UserOut(ORMBase):
    id: int
    name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool
    created_at: datetime


# No UserUpdate — no self-service profile edit in hackathon scope.


# ---------------------------------------------------------------------------
# Vehicle
# ---------------------------------------------------------------------------
class VehicleCreate(BaseModel):
    registration_number: str = Field(..., max_length=50)
    name: str = Field(..., max_length=120)
    type: str = Field(..., max_length=60)
    max_load_capacity: float = Field(..., gt=0)
    acquisition_cost: float = Field(..., ge=0)
    region: str | None = Field(None, max_length=100)
    # status/odometer NOT accepted on create: status defaults to Available
    # in the model; odometer starts at 0.0 and only moves via trip completion.


class VehicleUpdate(BaseModel):
    """Generic partial update — descriptive fields only, no invariant attached.
    Deliberately excludes: status (only via dispatch/complete/maintenance
    actions), odometer (only via complete_trip), acquisition_cost (write-once
    at creation for hackathon scope — revisit if Fleet Manager needs corrections)."""

    name: str | None = Field(None, max_length=120)
    type: str | None = Field(None, max_length=60)
    max_load_capacity: float | None = Field(None, gt=0)
    region: str | None = Field(None, max_length=100)


class VehicleOut(ORMBase):
    id: int
    registration_number: str
    name: str
    type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    status: VehicleStatus
    region: str | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------
class DriverCreate(BaseModel):
    name: str = Field(..., max_length=120)
    license_number: str = Field(..., max_length=60)
    license_category: str = Field(..., max_length=30)
    license_expiry_date: datetime
    contact_number: str | None = Field(None, max_length=20)
    # status defaults to Available; safety_score defaults to 100.0 in model.


class DriverUpdate(BaseModel):
    """Generic partial update — descriptive/contact/licensing fields only.
    Deliberately excludes: status and safety_score, which are Safety-Officer-
    only actions with their own schemas below."""

    name: str | None = Field(None, max_length=120)
    license_number: str | None = Field(None, max_length=60)
    license_category: str | None = Field(None, max_length=30)
    license_expiry_date: datetime | None = None
    contact_number: str | None = Field(None, max_length=20)


class DriverSafetyScoreUpdate(BaseModel):
    """Safety Officer only. Manual score entry, no auto-scoring logic."""

    safety_score: float = Field(..., ge=0, le=100)


class DriverStatusUpdate(BaseModel):
    """Safety Officer only (e.g. suspend/reinstate a driver)."""

    status: DriverStatus


class DriverOut(ORMBase):
    id: int
    name: str
    license_number: str
    license_category: str
    license_expiry_date: datetime
    contact_number: str | None
    safety_score: float
    status: DriverStatus
    created_at: datetime


# ---------------------------------------------------------------------------
# Trip
# ---------------------------------------------------------------------------
class TripCreate(BaseModel):
    source: str = Field(..., max_length=150)
    destination: str = Field(..., max_length=150)
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(..., gt=0)
    planned_distance: float = Field(..., gt=0)
    # status is NOT accepted — always starts Draft. created_by_user_id comes
    # from the authenticated user in the router, not the request body.


# No generic TripUpdate. Every field on Trip carries a business rule
# (cargo_weight <= vehicle capacity, status transitions with side effects
# on Vehicle/Driver), so all mutations are action-specific below.


class TripDispatchIn(BaseModel):
    """Dispatcher only. No fields needed — vehicle/driver/trip ids come
    from the existing Trip row (looked up by path param); this schema
    exists mainly so the route has a typed (empty) request body and a
    place to add a dispatch note/timestamp override later if needed."""

    pass


class TripCompleteIn(BaseModel):
    final_odometer: float = Field(..., gt=0)
    fuel_consumed: float = Field(..., gt=0)  # liters
    fuel_cost: float = Field(..., ge=0)  # used to create the auto FuelLog row


class TripCancelIn(BaseModel):
    reason: str | None = Field(None, max_length=255)


class TripOut(ORMBase):
    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    status: TripStatus
    created_by_user_id: int
    created_at: datetime
    dispatched_at: datetime | None
    completed_at: datetime | None
    final_odometer: float | None
    fuel_consumed: float | None


# ---------------------------------------------------------------------------
# MaintenanceLog
# ---------------------------------------------------------------------------
class MaintenanceLogCreate(BaseModel):
    vehicle_id: int
    description: str = Field(..., max_length=255)
    cost: float = Field(0.0, ge=0)
    # status defaults to Active; creating this record also flips
    # Vehicle.status -> In Shop (handled in maintenance_service, not here).


# No generic Update — cost/description corrections aren't in hackathon
# scope, and the only real mutation is closing the record.


class MaintenanceLogCloseIn(BaseModel):
    """No fields required; closing sets status -> Closed and closed_at ->
    now() in the service layer, and restores Vehicle.status -> Available
    unless the vehicle is Retired."""

    pass


class MaintenanceLogOut(ORMBase):
    id: int
    vehicle_id: int
    description: str
    cost: float
    status: MaintenanceStatus
    logged_by_user_id: int
    created_at: datetime
    closed_at: datetime | None


# ---------------------------------------------------------------------------
# FuelLog
# ---------------------------------------------------------------------------
class FuelLogCreate(BaseModel):
    """Used both for manual entries and internally by complete_trip()'s
    auto-created row."""

    vehicle_id: int
    liters: float = Field(..., gt=0)
    cost: float = Field(..., ge=0)


# No Update — write-once, re-enter/soft-delete instead of editing.


class FuelLogOut(ORMBase):
    id: int
    vehicle_id: int
    liters: float
    cost: float
    date: datetime


# ---------------------------------------------------------------------------
# Expense
# ---------------------------------------------------------------------------
class ExpenseCreate(BaseModel):
    vehicle_id: int
    type: ExpenseType = ExpenseType.OTHER  # client picks toll vs other
    amount: float = Field(..., gt=0)
    description: str | None = Field(None, max_length=255)


# No Update — write-once, re-enter/soft-delete instead of editing.


class ExpenseOut(ORMBase):
    id: int
    vehicle_id: int
    type: ExpenseType
    amount: float
    description: str | None
    date: datetime

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum  # from the login page's role dropdown


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"