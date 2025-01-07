from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.utils import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=schemas.Customer)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/", response_model=List[schemas.Customer])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    customers = db.query(models.Customer).offset(skip).limit(limit).all()
    return customers

@router.get("/{customer_id}", response_model=schemas.Customer)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(
    customer_id: int,
    customer_update: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer_update.dict().items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has any sales invoices
    has_sales = db.query(models.SalesInvoice).filter(
        models.SalesInvoice.customer_id == customer_id
    ).first() is not None
    
    if has_sales:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer with existing sales records"
        )
    
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

@router.get("/{customer_id}/sales", response_model=List[schemas.SalesInvoice])
def read_customer_sales(
    customer_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    sales = db.query(models.SalesInvoice).filter(
        models.SalesInvoice.customer_id == customer_id
    ).offset(skip).limit(limit).all()
    
    return sales

@router.get("/{customer_id}/statistics")
def get_customer_statistics(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get all sales invoices
    sales = db.query(models.SalesInvoice).filter(
        models.SalesInvoice.customer_id == customer_id
    ).all()
    
    # Calculate statistics
    total_sales_iqd = sum(sale.total_amount_iqd for sale in sales)
    total_sales_usd = sum(sale.total_amount_usd for sale in sales)
    total_invoices = len(sales)
    
    # Get last purchase date
    last_purchase = db.query(models.SalesInvoice).filter(
        models.SalesInvoice.customer_id == customer_id
    ).order_by(models.SalesInvoice.date.desc()).first()
    
    return {
        "total_sales_iqd": total_sales_iqd,
        "total_sales_usd": total_sales_usd,
        "total_invoices": total_invoices,
        "last_purchase_date": last_purchase.date if last_purchase else None
    }
