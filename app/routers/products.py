from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.utils import get_current_active_user
import shutil
import os
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=schemas.Product)
async def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.post("/{product_id}/image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/products"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the file
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{product_id}_{datetime.now().timestamp()}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update product with image URL
    product.image_url = file_path
    db.commit()
    
    return {"filename": file_name}

@router.get("/", response_model=List[schemas.Product])
def read_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product_update: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_update.dict().items():
        setattr(db_product, key, value)
    
    db_product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product has any related records
    has_stock_movements = db.query(models.StockMovement).filter(
        models.StockMovement.product_id == product_id
    ).first() is not None
    
    has_purchase_items = db.query(models.PurchaseInvoiceItem).filter(
        models.PurchaseInvoiceItem.product_id == product_id
    ).first() is not None
    
    has_sales_items = db.query(models.SalesInvoiceItem).filter(
        models.SalesInvoiceItem.product_id == product_id
    ).first() is not None
    
    if has_stock_movements or has_purchase_items or has_sales_items:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product with existing transactions"
        )
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
