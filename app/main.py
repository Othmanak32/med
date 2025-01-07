from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas
from .database import engine, get_db
from .routers import (
    products,
    inventory,
    purchases,
    sales,
    customers,
    suppliers,
    reports,
    users,
    auth,
    currency,
    dashboard,
    inventory_analysis,
    backup,
    documents
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Accounting System API")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(products.router, prefix="/api", tags=["Products"])
app.include_router(inventory.router, prefix="/api", tags=["Inventory"])
app.include_router(purchases.router, prefix="/api", tags=["Purchases"])
app.include_router(sales.router, prefix="/api", tags=["Sales"])
app.include_router(customers.router, prefix="/api", tags=["Customers"])
app.include_router(suppliers.router, prefix="/api", tags=["Suppliers"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(currency.router, prefix="/api", tags=["Currency"])
app.include_router(dashboard.router, prefix="/api/reports", tags=["Dashboard"])
app.include_router(inventory_analysis.router, prefix="/api/reports", tags=["Inventory Analysis"])
app.include_router(backup.router, prefix="/api", tags=["Backup"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Accounting System API"}
