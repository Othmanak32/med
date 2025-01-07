from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.utils import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.post("/movements/", response_model=schemas.StockMovement)
def create_stock_movement(
    movement: schemas.StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Get the product
    product = db.query(models.Product).filter(models.Product.id == movement.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create stock movement
    db_movement = models.StockMovement(
        **movement.dict(),
        created_by=current_user.id
    )
    db.add(db_movement)
    
    # Update product stock
    if movement.movement_type in [schemas.StockMovementType.PURCHASE, schemas.StockMovementType.RETURN]:
        product.current_stock += movement.quantity
    else:
        if product.current_stock < movement.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.current_stock -= movement.quantity
    
    product.last_stock_update = datetime.utcnow()
    
    db.commit()
    db.refresh(db_movement)
    return db_movement

@router.get("/movements/", response_model=List[schemas.StockMovement])
def read_stock_movements(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    movements = db.query(models.StockMovement).offset(skip).limit(limit).all()
    return movements

@router.get("/movements/{movement_id}", response_model=schemas.StockMovement)
def read_stock_movement(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    movement = db.query(models.StockMovement).filter(models.StockMovement.id == movement_id).first()
    if movement is None:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    return movement

@router.get("/low-stock/", response_model=List[schemas.Product])
def get_low_stock_products(
    threshold: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    products = db.query(models.Product).filter(models.Product.current_stock <= threshold).all()
    return products

@router.post("/adjust-stock/{product_id}")
def adjust_stock(
    product_id: int,
    quantity: int,
    notes: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create stock movement for adjustment
    movement = models.StockMovement(
        product_id=product_id,
        movement_type=schemas.StockMovementType.ADJUSTMENT,
        quantity=abs(quantity),  # Store absolute value
        reference_id="ADJ-" + datetime.utcnow().strftime("%Y%m%d-%H%M%S"),
        notes=notes,
        created_by=current_user.id
    )
    db.add(movement)
    
    # Update product stock
    product.current_stock = quantity
    product.last_stock_update = datetime.utcnow()
    
    db.commit()
    return {"message": "Stock adjusted successfully", "new_stock": quantity}
