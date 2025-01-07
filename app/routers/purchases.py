from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.utils import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=schemas.PurchaseInvoice)
def create_purchase_invoice(
    invoice: schemas.PurchaseInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Generate invoice number
    invoice_number = f"PUR-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    
    # Calculate totals
    total_amount_iqd = 0
    total_amount_usd = 0
    
    # Create invoice
    db_invoice = models.PurchaseInvoice(
        invoice_number=invoice_number,
        supplier_id=invoice.supplier_id,
        notes=invoice.notes,
        created_by=current_user.id,
        total_amount_iqd=total_amount_iqd,
        total_amount_usd=total_amount_usd
    )
    db.add(db_invoice)
    db.flush()  # Get invoice ID without committing
    
    # Create invoice items and update stock
    for item in invoice.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        # Calculate item totals
        total_price_iqd = item.quantity * item.unit_price_iqd
        total_price_usd = item.quantity * item.unit_price_usd
        
        # Create invoice item
        db_item = models.PurchaseInvoiceItem(
            invoice_id=db_invoice.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price_iqd=item.unit_price_iqd,
            unit_price_usd=item.unit_price_usd,
            total_price_iqd=total_price_iqd,
            total_price_usd=total_price_usd
        )
        db.add(db_item)
        
        # Update invoice totals
        total_amount_iqd += total_price_iqd
        total_amount_usd += total_price_usd
        
        # Create stock movement
        stock_movement = models.StockMovement(
            product_id=item.product_id,
            movement_type="purchase",
            quantity=item.quantity,
            reference_id=invoice_number,
            created_by=current_user.id
        )
        db.add(stock_movement)
        
        # Update product stock
        product.current_stock += item.quantity
        product.last_stock_update = datetime.utcnow()
    
    # Update invoice totals
    db_invoice.total_amount_iqd = total_amount_iqd
    db_invoice.total_amount_usd = total_amount_usd
    
    # Create transaction record
    transaction = models.Transaction(
        type="expense",
        amount_iqd=total_amount_iqd,
        amount_usd=total_amount_usd,
        date=datetime.utcnow(),
        description=f"Purchase Invoice {invoice_number}",
        reference_type="purchase_invoice",
        reference_id=db_invoice.id,
        created_by=current_user.id
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.get("/", response_model=List[schemas.PurchaseInvoice])
def read_purchase_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    invoices = db.query(models.PurchaseInvoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/{invoice_id}", response_model=schemas.PurchaseInvoice)
def read_purchase_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    invoice = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.id == invoice_id).first()
    if invoice is None:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")
    return invoice

@router.delete("/{invoice_id}")
def delete_purchase_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    invoice = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.id == invoice_id).first()
    if invoice is None:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")
    
    # Check if this is the latest transaction for each product
    for item in invoice.items:
        latest_movement = db.query(models.StockMovement).filter(
            models.StockMovement.product_id == item.product_id
        ).order_by(models.StockMovement.created_at.desc()).first()
        
        if latest_movement and latest_movement.reference_id == invoice.invoice_number:
            # Update product stock
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.current_stock -= item.quantity
                product.last_stock_update = datetime.utcnow()
            
            # Delete stock movement
            db.query(models.StockMovement).filter(
                models.StockMovement.reference_id == invoice.invoice_number,
                models.StockMovement.product_id == item.product_id
            ).delete()
        else:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete invoice as there are newer transactions for some products"
            )
    
    # Delete related transaction
    db.query(models.Transaction).filter(
        models.Transaction.reference_type == "purchase_invoice",
        models.Transaction.reference_id == invoice_id
    ).delete()
    
    # Delete invoice items
    db.query(models.PurchaseInvoiceItem).filter(
        models.PurchaseInvoiceItem.invoice_id == invoice_id
    ).delete()
    
    # Delete invoice
    db.delete(invoice)
    db.commit()
    
    return {"message": "Purchase invoice deleted successfully"}
