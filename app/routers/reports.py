from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..auth.utils import get_current_active_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/sales/summary")
def get_sales_summary(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    sales = db.query(models.SalesInvoice).filter(
        models.SalesInvoice.date.between(start_date, end_date)
    ).all()
    
    return {
        "total_sales_iqd": sum(sale.total_amount_iqd for sale in sales),
        "total_sales_usd": sum(sale.total_amount_usd for sale in sales),
        "total_invoices": len(sales),
        "average_sale_iqd": sum(sale.total_amount_iqd for sale in sales) / len(sales) if sales else 0,
        "total_discount_amount": sum(sale.discount_amount for sale in sales)
    }

@router.get("/purchases/summary")
def get_purchases_summary(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    purchases = db.query(models.PurchaseInvoice).filter(
        models.PurchaseInvoice.date.between(start_date, end_date)
    ).all()
    
    return {
        "total_purchases_iqd": sum(purchase.total_amount_iqd for purchase in purchases),
        "total_purchases_usd": sum(purchase.total_amount_usd for purchase in purchases),
        "total_invoices": len(purchases),
        "average_purchase_iqd": sum(purchase.total_amount_iqd for purchase in purchases) / len(purchases) if purchases else 0
    }

@router.get("/inventory/status")
def get_inventory_status(
    low_stock_threshold: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Get all products with their current stock
    products = db.query(models.Product).all()
    
    # Categorize products
    low_stock = []
    out_of_stock = []
    healthy_stock = []
    
    for product in products:
        if product.current_stock == 0:
            out_of_stock.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "current_stock": product.current_stock
            })
        elif product.current_stock <= low_stock_threshold:
            low_stock.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "current_stock": product.current_stock
            })
        else:
            healthy_stock.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "current_stock": product.current_stock
            })
    
    return {
        "low_stock_products": low_stock,
        "out_of_stock_products": out_of_stock,
        "healthy_stock_products": healthy_stock,
        "total_products": len(products)
    }

@router.get("/inventory/movements")
def get_inventory_movements(
    start_date: datetime,
    end_date: datetime,
    product_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.StockMovement).filter(
        models.StockMovement.created_at.between(start_date, end_date)
    )
    
    if product_id:
        query = query.filter(models.StockMovement.product_id == product_id)
    if movement_type:
        query = query.filter(models.StockMovement.movement_type == movement_type)
    
    movements = query.all()
    
    return [
        {
            "id": movement.id,
            "product_id": movement.product_id,
            "product_name": movement.product.name,
            "movement_type": movement.movement_type,
            "quantity": movement.quantity,
            "reference_id": movement.reference_id,
            "created_at": movement.created_at
        }
        for movement in movements
    ]

@router.get("/profit-loss")
def get_profit_loss_report(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Get all transactions in the period
    transactions = db.query(models.Transaction).filter(
        models.Transaction.date.between(start_date, end_date)
    ).all()
    
    # Calculate totals
    revenue_iqd = sum(t.amount_iqd for t in transactions if t.type == "revenue")
    revenue_usd = sum(t.amount_usd for t in transactions if t.type == "revenue")
    expenses_iqd = sum(t.amount_iqd for t in transactions if t.type == "expense")
    expenses_usd = sum(t.amount_usd for t in transactions if t.type == "expense")
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "revenue": {
            "iqd": revenue_iqd,
            "usd": revenue_usd
        },
        "expenses": {
            "iqd": expenses_iqd,
            "usd": expenses_usd
        },
        "net_profit": {
            "iqd": revenue_iqd - expenses_iqd,
            "usd": revenue_usd - expenses_usd
        }
    }

@router.get("/best-selling")
def get_best_selling_products(
    start_date: datetime,
    end_date: datetime,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Query for best-selling products
    best_sellers = db.query(
        models.SalesInvoiceItem.product_id,
        models.Product.name,
        func.sum(models.SalesInvoiceItem.quantity).label('total_quantity'),
        func.sum(models.SalesInvoiceItem.total_price_iqd).label('total_revenue_iqd')
    ).join(
        models.SalesInvoice,
        models.SalesInvoiceItem.invoice_id == models.SalesInvoice.id
    ).join(
        models.Product,
        models.SalesInvoiceItem.product_id == models.Product.id
    ).filter(
        models.SalesInvoice.date.between(start_date, end_date)
    ).group_by(
        models.SalesInvoiceItem.product_id,
        models.Product.name
    ).order_by(
        func.sum(models.SalesInvoiceItem.quantity).desc()
    ).limit(limit).all()
    
    return [
        {
            "product_id": item.product_id,
            "product_name": item.name,
            "total_quantity": item.total_quantity,
            "total_revenue_iqd": item.total_revenue_iqd
        }
        for item in best_sellers
    ]

@router.get("/customer-analysis")
def get_customer_analysis(
    start_date: datetime,
    end_date: datetime,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Query for top customers
    top_customers = db.query(
        models.SalesInvoice.customer_id,
        models.Customer.name,
        func.count(models.SalesInvoice.id).label('total_purchases'),
        func.sum(models.SalesInvoice.total_amount_iqd).label('total_spent_iqd')
    ).join(
        models.Customer,
        models.SalesInvoice.customer_id == models.Customer.id
    ).filter(
        models.SalesInvoice.date.between(start_date, end_date)
    ).group_by(
        models.SalesInvoice.customer_id,
        models.Customer.name
    ).order_by(
        func.sum(models.SalesInvoice.total_amount_iqd).desc()
    ).limit(limit).all()
    
    return [
        {
            "customer_id": item.customer_id,
            "customer_name": item.name,
            "total_purchases": item.total_purchases,
            "total_spent_iqd": item.total_spent_iqd
        }
        for item in top_customers
    ]

@router.get("/supplier-analysis")
def get_supplier_analysis(
    start_date: datetime,
    end_date: datetime,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Query for top suppliers
    top_suppliers = db.query(
        models.PurchaseInvoice.supplier_id,
        models.Supplier.name,
        func.count(models.PurchaseInvoice.id).label('total_purchases'),
        func.sum(models.PurchaseInvoice.total_amount_iqd).label('total_amount_iqd')
    ).join(
        models.Supplier,
        models.PurchaseInvoice.supplier_id == models.Supplier.id
    ).filter(
        models.PurchaseInvoice.date.between(start_date, end_date)
    ).group_by(
        models.PurchaseInvoice.supplier_id,
        models.Supplier.name
    ).order_by(
        func.sum(models.PurchaseInvoice.total_amount_iqd).desc()
    ).limit(limit).all()
    
    return [
        {
            "supplier_id": item.supplier_id,
            "supplier_name": item.name,
            "total_purchases": item.total_purchases,
            "total_amount_iqd": item.total_amount_iqd
        }
        for item in top_suppliers
    ]
