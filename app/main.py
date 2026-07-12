from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import (
    auth,
    dashboard,
    drivers,
    expenses,
    maintenance,
    reports,
    trips,
    vehicles,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TransitOps", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(expenses.router)
app.include_router(reports.router)
app.include_router(dashboard.router)