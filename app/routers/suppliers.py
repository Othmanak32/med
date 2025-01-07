from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.utils import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=schemas.Supplier)
def create_supplier(
    supplier: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/", response_model=List[schemas.Supplier])
def read_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    suppliers = db.query(models.Supplier).offset(skip).limit(limit).all()
    return suppliers

@router.get("/{supplier_id}", response_model=schemas.Supplier)
def read_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(
    supplier_id: int,
    supplier_update: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    for key, value in supplier_update.dict().items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check if supplier has any purchase invoices
    has_purchases = db.query(models.PurchaseInvoice).filter(
        models.PurchaseInvoice.supplier_id == supplier_id
    ).first() is not None
    
    if has_purchases:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete supplier with existing purchase records"
        )
    
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}

@router.get("/{supplier_id}/purchases", response_model=List[schemas.PurchaseInvoice])
def read_supplier_purchases(
    supplier_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    purchases = db.query(models.PurchaseInvoice).filter(
        models.PurchaseInvoice.supplier_id == supplier_id
    ).offset(skip).limit(limit).all()
    
    return purchases

@router.get("/{supplier_id}/statistics")
def get_supplier_statistics(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Get all purchase invoices
    purchases = db.query(models.PurchaseInvoice).filter(
        models.PurchaseInvoice.supplier_id == supplier_id
    ).all()
    
    # Calculate statistics
    total_purchases_iqd = sum(purchase.total_amount_iqd for purchase in purchases)
    total_purchases_usd = sum(purchase.total_amount_usd for purchase in purchases)
    total_invoices = len(purchases)
    
    # Get most purchased products
    purchase_items = db.query(
        models.PurchaseInvoiceItem.product_id,
        models.Product.name,
        db.func.sum(models.PurchaseInvoiceItem.quantity).label('total_quantity'),
        db.func.sum(models.PurchaseInvoiceItem.total_price_iqd).label('total_amount_iqd')
    ).join(
        models.PurchaseInvoice,
        models.PurchaseInvoiceItem.invoice_id == models.PurchaseInvoice.id
    ).join(
        models.Product,
        models.PurchaseInvoiceItem.product_id == models.Product.id
    ).filter(
        models.PurchaseInvoice.supplier_id == supplier_id
    ).group_by(
        models.PurchaseInvoiceItem.product_id,
        models.Product.name
    ).order_by(
        db.text('total_quantity DESC')
    ).limit(5).all()
    
    return {
        "total_purchases_iqd": total_purchases_iqd,
        "total_purchases_usd": total_purchases_usd,
        "total_invoices": total_invoices,
        "most_purchased_products": [
            {
                "product_id": item.product_id,
                "product_name": item.name,
                "total_quantity": item.total_quantity,
                "total_amount_iqd": item.total_amount_iqd
            }
            for item in purchase_items
        ]
    }
