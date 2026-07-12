from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.enums import (
    RoleEnum,
    VehicleStatus,
    DriverStatus,
    TripStatus,
    MaintenanceStatus,
    ExpenseType,
)


# ---------------------------------------------------------------------------
# User (staff login: Fleet Manager / Dispatcher / Safety Officer / Financial Analyst)
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Audit relationships (things this user created/logged)
    trips_created = relationship(
        "Trip", back_populates="created_by", foreign_keys="Trip.created_by_user_id"
    )
    maintenance_logged = relationship(
        "MaintenanceLog",
        back_populates="logged_by",
        foreign_keys="MaintenanceLog.logged_by_user_id",
    )


# ---------------------------------------------------------------------------
# Vehicle
# ---------------------------------------------------------------------------
class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)  # Vehicle Name/Model
    type = Column(String(60), nullable=False)  # e.g. Van, Truck, Bike
    max_load_capacity = Column(Float, nullable=False)  # kg
    odometer = Column(Float, default=0.0, nullable=False)
    acquisition_cost = Column(Float, nullable=False)
    status = Column(
        SAEnum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False
    )
    region = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------
class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    license_number = Column(String(60), unique=True, index=True, nullable=False)
    license_category = Column(String(30), nullable=False)
    license_expiry_date = Column(DateTime, nullable=False)
    contact_number = Column(String(20), nullable=True)
    safety_score = Column(Float, default=100.0, nullable=False)
    status = Column(
        SAEnum(DriverStatus), default=DriverStatus.AVAILABLE, nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    trips = relationship("Trip", back_populates="driver")


# ---------------------------------------------------------------------------
# Trip
# ---------------------------------------------------------------------------
class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(150), nullable=False)
    destination = Column(String(150), nullable=False)

    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)

    cargo_weight = Column(Float, nullable=False)
    planned_distance = Column(Float, nullable=False)

    status = Column(SAEnum(TripStatus), default=TripStatus.DRAFT, nullable=False)

    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Filled in on completion (Step 6 of example workflow)
    final_odometer = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)  # liters, denormalized for quick trip-level efficiency
    revenue = Column(Float, nullable=True)  # entered at completion, drives ROI/Monthly Revenue reporting

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    created_by = relationship(
        "User", back_populates="trips_created", foreign_keys=[created_by_user_id]
    )


# ---------------------------------------------------------------------------
# MaintenanceLog
# ---------------------------------------------------------------------------
class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    description = Column(String(255), nullable=False)  # e.g. "Oil Change"
    cost = Column(Float, default=0.0, nullable=False)
    status = Column(
        SAEnum(MaintenanceStatus), default=MaintenanceStatus.ACTIVE, nullable=False
    )

    logged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
    logged_by = relationship(
        "User",
        back_populates="maintenance_logged",
        foreign_keys=[logged_by_user_id],
    )


# ---------------------------------------------------------------------------
# FuelLog  (manual entries + auto-created on Trip completion)
# ---------------------------------------------------------------------------
class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")


# ---------------------------------------------------------------------------
# Expense (tolls / other operational costs)
# ---------------------------------------------------------------------------
class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    type = Column(SAEnum(ExpenseType), default=ExpenseType.OTHER, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)

    vehicle = relationship("Vehicle", back_populates="expenses")