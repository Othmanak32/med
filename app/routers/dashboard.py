from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, and_, desc
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from ..database import get_db
from .. import models
from ..auth.utils import get_current_active_user

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_metrics(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get dashboard metrics including sales trends, top products, and profit/loss analysis"""
    
    # Calculate total sales
    total_sales = db.query(func.sum(models.SalesInvoice.total_amount))\
        .filter(models.SalesInvoice.date.between(start_date, end_date))\
        .scalar() or 0

    # Calculate total orders
    total_orders = db.query(func.count(models.SalesInvoice.id))\
        .filter(models.SalesInvoice.date.between(start_date, end_date))\
        .scalar() or 0

    # Calculate total profit
    total_profit = db.query(
        func.sum(
            models.SalesInvoiceItem.quantity * 
            (models.SalesInvoiceItem.unit_price - models.Product.cost_price)
        )
    ).join(models.Product)\
        .join(models.SalesInvoice)\
        .filter(models.SalesInvoice.date.between(start_date, end_date))\
        .scalar() or 0

    # Get low stock items count
    low_stock_count = db.query(func.count(models.Product.id))\
        .filter(models.Product.quantity <= models.Product.min_quantity)\
        .scalar() or 0

    # Get sales trend
    sales_trend = db.query(
        func.date_trunc('day', models.SalesInvoice.date).label('date'),
        func.sum(models.SalesInvoice.total_amount).label('total')
    ).filter(
        models.SalesInvoice.date.between(start_date, end_date)
    ).group_by(
        func.date_trunc('day', models.SalesInvoice.date)
    ).order_by('date').all()

    # Get top products
    top_products = db.query(
        models.Product.name,
        func.sum(models.SalesInvoiceItem.quantity * models.SalesInvoiceItem.unit_price).label('total_sales')
    ).join(models.SalesInvoiceItem)\
        .join(models.SalesInvoice)\
        .filter(models.SalesInvoice.date.between(start_date, end_date))\
        .group_by(models.Product.id)\
        .order_by(desc('total_sales'))\
        .limit(5)\
        .all()

    # Calculate profit/loss trend
    profit_loss = db.query(
        func.date_trunc('day', models.SalesInvoice.date).label('date'),
        func.sum(
            models.SalesInvoiceItem.quantity * 
            (models.SalesInvoiceItem.unit_price - models.Product.cost_price)
        ).label('profit')
    ).join(models.SalesInvoiceItem)\
        .join(models.Product)\
        .filter(models.SalesInvoice.date.between(start_date, end_date))\
        .group_by(func.date_trunc('day', models.SalesInvoice.date))\
        .order_by('date')\
        .all()

    return {
        "total_sales": total_sales,
        "total_orders": total_orders,
        "total_profit": total_profit,
        "low_stock_count": low_stock_count,
        "sales_trend": [{"date": item.date, "total": float(item.total)} for item in sales_trend],
        "top_products": [{"name": item.name, "total_sales": float(item.total_sales)} for item in top_products],
        "profit_loss": [{"date": item.date, "profit": float(item.profit)} for item in profit_loss]
    }
