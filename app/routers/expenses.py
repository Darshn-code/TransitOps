"""
routers/expenses.py

RBAC (Fuel/Exp column): Financial Analyst = CRUD, everyone else = 403.
No service module: both FuelLog and Expense are write-once, no-status,
no-side-effect-on-other-tables rows (per schemas.py's "No Update —
write-once" notes), so plain ORM inserts live directly in the router.

Two resources (fuel-logs, expenses) share one router file since they're
both simple list+create endpoints under the same RBAC gate and the
same wireframe page (Page 7 — Fuel & Expense Management).

Note: FuelLog rows are also auto-created by trip_service.complete_trip
on the Dispatcher's trip-completion action. Those rows will appear in
GET /fuel-logs alongside manually-entered ones — expected, matches
Page 7's combined table.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database import get_db
from app.enums import RoleEnum
from app.models import Expense, FuelLog
from app.schemas import ExpenseCreate, ExpenseOut, FuelLogCreate, FuelLogOut

router = APIRouter(tags=["fuel-and-expenses"])

_ROLE = require_role(RoleEnum.FINANCIAL_ANALYST)


@router.get(
    "/fuel-logs", response_model=list[FuelLogOut], dependencies=[Depends(_ROLE)]
)
def list_fuel_logs(db: Session = Depends(get_db)) -> list[FuelLog]:
    return db.query(FuelLog).all()


@router.post(
    "/fuel-logs",
    response_model=FuelLogOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_ROLE)],
)
def create_fuel_log(data: FuelLogCreate, db: Session = Depends(get_db)) -> FuelLog:
    fuel_log = FuelLog(**data.model_dump())
    db.add(fuel_log)
    db.commit()
    db.refresh(fuel_log)
    return fuel_log


@router.get(
    "/expenses", response_model=list[ExpenseOut], dependencies=[Depends(_ROLE)]
)
def list_expenses(db: Session = Depends(get_db)) -> list[Expense]:
    return db.query(Expense).all()


@router.post(
    "/expenses",
    response_model=ExpenseOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_ROLE)],
)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)) -> Expense:
    expense = Expense(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense