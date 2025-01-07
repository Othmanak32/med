from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.pdf_service import PDFService
from ..auth.utils import get_current_active_user
from .. import models

router = APIRouter()
pdf_service = PDFService()

@router.get("/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf(
    invoice_id: int,
    format: str = "pdf",
    template: str = "invoice_modern.html",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Generate PDF for a specific invoice"""
    # Fetch invoice data
    invoice = db.query(models.SalesInvoice).filter(
        models.SalesInvoice.id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Fetch invoice items
    items = db.query(models.SalesInvoiceItem).filter(
        models.SalesInvoiceItem.invoice_id == invoice_id
    ).all()
    
    # Fetch customer data
    customer = db.query(models.Customer).filter(
        models.Customer.id == invoice.customer_id
    ).first()
    
    # Prepare invoice data
    invoice_data = {
        "invoice_number": invoice.invoice_number,
        "company_name": "Your Company Name",  # Replace with actual company info
        "company_address": "Your Company Address",
        "company_phone": "Your Company Phone",
        "company_email": "your@email.com",
        "customer_name": customer.name,
        "customer_address": customer.address,
        "customer_phone": customer.phone,
        "customer_email": customer.email,
        "items": [
            {
                "name": item.product.name,
                "description": item.product.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total": item.quantity * item.unit_price
            }
            for item in items
        ],
        "subtotal": sum(item.quantity * item.unit_price for item in items),
        "tax_rate": invoice.tax_rate,
        "tax_amount": invoice.tax_amount,
        "discount_amount": invoice.discount_amount,
        "total_amount": invoice.total_amount,
        "currency": invoice.currency,
        "currency_symbol": "$" if invoice.currency == "USD" else "IQD",
        "notes": invoice.notes,
        "payment_info": "Please make payment within the due date",
        "terms": "Terms and conditions apply"
    }
    
    # Generate PDF
    pdf_path = pdf_service.generate_invoice(
        invoice_data,
        template_name=template,
        output_format=format
    )
    
    return FileResponse(
        path=pdf_path,
        filename=f"invoice_{invoice.invoice_number}.{format}",
        media_type=f"application/{format}"
    )

@router.get("/purchases/{po_id}/pdf")
async def generate_purchase_order_pdf(
    po_id: int,
    template: str = "purchase_order_modern.html",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Generate PDF for a specific purchase order"""
    # Fetch purchase order data
    po = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == po_id
    ).first()
    
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Fetch PO items
    items = db.query(models.PurchaseOrderItem).filter(
        models.PurchaseOrderItem.purchase_order_id == po_id
    ).all()
    
    # Fetch supplier data
    supplier = db.query(models.Supplier).filter(
        models.Supplier.id == po.supplier_id
    ).first()
    
    # Prepare PO data
    po_data = {
        "po_number": po.po_number,
        "company_name": "Your Company Name",  # Replace with actual company info
        "company_address": "Your Company Address",
        "company_phone": "Your Company Phone",
        "company_email": "your@email.com",
        "supplier_name": supplier.name,
        "supplier_address": supplier.address,
        "supplier_phone": supplier.phone,
        "supplier_email": supplier.email,
        "items": [
            {
                "name": item.product.name,
                "description": item.product.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total": item.quantity * item.unit_price
            }
            for item in items
        ],
        "subtotal": sum(item.quantity * item.unit_price for item in items),
        "tax_rate": po.tax_rate,
        "tax_amount": po.tax_amount,
        "discount_amount": po.discount_amount,
        "total_amount": po.total_amount,
        "currency": po.currency,
        "currency_symbol": "$" if po.currency == "USD" else "IQD",
        "notes": po.notes,
        "terms": "Standard terms and conditions apply",
        "authorized_by": current_user.get("full_name", "")
    }
    
    # Generate PDF
    pdf_path = pdf_service.generate_purchase_order(po_data, template_name=template)
    
    return FileResponse(
        path=pdf_path,
        filename=f"po_{po.po_number}.pdf",
        media_type="application/pdf"
    )
