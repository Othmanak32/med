from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.utils import get_current_active_user
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=schemas.SalesInvoice)
def create_sales_invoice(
    invoice: schemas.SalesInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Generate invoice number
    invoice_number = f"SAL-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    
    # Calculate totals
    subtotal_iqd = 0
    subtotal_usd = 0
    
    # Validate stock availability and calculate totals
    for item in invoice.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        if product.current_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {product.name}. Available: {product.current_stock}"
            )
        
        subtotal_iqd += item.quantity * item.unit_price_iqd
        subtotal_usd += item.quantity * item.unit_price_usd
    
    # Calculate final totals
    total_amount_iqd = subtotal_iqd - invoice.discount_amount
    total_amount_usd = subtotal_usd - (invoice.discount_amount / db.query(models.Settings).first().usd_to_iqd_rate)
    
    # Create invoice
    db_invoice = models.SalesInvoice(
        invoice_number=invoice_number,
        customer_id=invoice.customer_id,
        subtotal_iqd=subtotal_iqd,
        subtotal_usd=subtotal_usd,
        discount_amount=invoice.discount_amount,
        total_amount_iqd=total_amount_iqd,
        total_amount_usd=total_amount_usd,
        payment_method=invoice.payment_method,
        notes=invoice.notes,
        created_by=current_user.id
    )
    db.add(db_invoice)
    db.flush()
    
    # Create invoice items and update stock
    for item in invoice.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        
        # Calculate item totals
        total_price_iqd = item.quantity * item.unit_price_iqd
        total_price_usd = item.quantity * item.unit_price_usd
        
        # Create invoice item
        db_item = models.SalesInvoiceItem(
            invoice_id=db_invoice.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price_iqd=item.unit_price_iqd,
            unit_price_usd=item.unit_price_usd,
            total_price_iqd=total_price_iqd,
            total_price_usd=total_price_usd
        )
        db.add(db_item)
        
        # Create stock movement
        stock_movement = models.StockMovement(
            product_id=item.product_id,
            movement_type="sale",
            quantity=item.quantity,
            reference_id=invoice_number,
            created_by=current_user.id
        )
        db.add(stock_movement)
        
        # Update product stock
        product.current_stock -= item.quantity
        product.last_stock_update = datetime.utcnow()
    
    # Create transaction record
    transaction = models.Transaction(
        type="revenue",
        amount_iqd=total_amount_iqd,
        amount_usd=total_amount_usd,
        date=datetime.utcnow(),
        description=f"Sales Invoice {invoice_number}",
        reference_type="sales_invoice",
        reference_id=db_invoice.id,
        created_by=current_user.id
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@router.post("/return/{invoice_id}")
def create_sales_return(
    invoice_id: int,
    items: List[dict],
    notes: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    invoice = db.query(models.SalesInvoice).filter(models.SalesInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Sales invoice not found")
    
    return_number = f"RET-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    total_return_amount_iqd = 0
    total_return_amount_usd = 0
    
    for item in items:
        product_id = item["product_id"]
        return_quantity = item["quantity"]
        
        # Validate return quantity against original sale
        original_item = next(
            (i for i in invoice.items if i.product_id == product_id),
            None
        )
        if not original_item:
            raise HTTPException(
                status_code=400,
                detail=f"Product {product_id} was not in original invoice"
            )
        if return_quantity > original_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Return quantity exceeds original sale quantity for product {product_id}"
            )
        
        # Update product stock
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        product.current_stock += return_quantity
        product.last_stock_update = datetime.utcnow()
        
        # Create stock movement
        stock_movement = models.StockMovement(
            product_id=product_id,
            movement_type="return",
            quantity=return_quantity,
            reference_id=return_number,
            notes=notes,
            created_by=current_user.id
        )
        db.add(stock_movement)
        
        # Calculate return amounts
        return_amount_iqd = return_quantity * original_item.unit_price_iqd
        return_amount_usd = return_quantity * original_item.unit_price_usd
        total_return_amount_iqd += return_amount_iqd
        total_return_amount_usd += return_amount_usd
    
    # Create transaction record for return
    transaction = models.Transaction(
        type="expense",
        amount_iqd=total_return_amount_iqd,
        amount_usd=total_return_amount_usd,
        date=datetime.utcnow(),
        description=f"Sales Return {return_number} for Invoice {invoice.invoice_number}",
        reference_type="sales_return",
        reference_id=invoice_id,
        created_by=current_user.id
    )
    db.add(transaction)
    
    db.commit()
    return {
        "message": "Sales return processed successfully",
        "return_number": return_number,
        "total_return_amount_iqd": total_return_amount_iqd,
        "total_return_amount_usd": total_return_amount_usd
    }

@router.get("/", response_model=List[schemas.SalesInvoice])
def read_sales_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    invoices = db.query(models.SalesInvoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/{invoice_id}", response_model=schemas.SalesInvoice)
def read_sales_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    invoice = db.query(models.SalesInvoice).filter(models.SalesInvoice.id == invoice_id).first()
    if invoice is None:
        raise HTTPException(status_code=404, detail="Sales invoice not found")
    return invoice

@router.delete("/{invoice_id}")
def delete_sales_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    invoice = db.query(models.SalesInvoice).filter(models.SalesInvoice.id == invoice_id).first()
    if invoice is None:
        raise HTTPException(status_code=404, detail="Sales invoice not found")
    
    # Check if this is the latest transaction for each product
    for item in invoice.items:
        latest_movement = db.query(models.StockMovement).filter(
            models.StockMovement.product_id == item.product_id
        ).order_by(models.StockMovement.created_at.desc()).first()
        
        if latest_movement and latest_movement.reference_id == invoice.invoice_number:
            # Update product stock
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.current_stock += item.quantity
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
        models.Transaction.reference_type == "sales_invoice",
        models.Transaction.reference_id == invoice_id
    ).delete()
    
    # Delete invoice items
    db.query(models.SalesInvoiceItem).filter(
        models.SalesInvoiceItem.invoice_id == invoice_id
    ).delete()
    
    # Delete invoice
    db.delete(invoice)
    db.commit()
    
    return {"message": "Sales invoice deleted successfully"}
