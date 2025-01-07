from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from ..database import get_db
from .. import models
from ..auth.utils import get_current_active_user

router = APIRouter()

@router.get("/inventory-analysis")
def get_inventory_analysis(
    analysis_type: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get detailed inventory analysis based on analysis type"""
    
    if analysis_type == "value":
        # Get stock value by category
        stock_value = db.query(
            models.Product.category.label('category'),
            func.count(models.Product.id).label('total_items'),
            func.sum(models.Product.quantity * models.Product.cost_price).label('total_value')
        ).group_by(
            models.Product.category
        ).order_by(desc('total_value')).all()

        return {
            "stock_value": [
                {
                    "category": item.category,
                    "total_items": item.total_items,
                    "total_value": float(item.total_value)
                }
                for item in stock_value
            ]
        }

    elif analysis_type == "turnover":
        # Calculate inventory turnover rate
        # Formula: Units Sold / Average Inventory
        three_months_ago = datetime.now() - timedelta(days=90)
        
        # Get units sold in last 3 months
        units_sold = db.query(
            models.Product.id.label('product_id'),
            models.Product.name.label('product_name'),
            func.sum(models.SalesInvoiceItem.quantity).label('units_sold')
        ).join(
            models.SalesInvoiceItem
        ).join(
            models.SalesInvoice
        ).filter(
            models.SalesInvoice.date >= three_months_ago
        ).group_by(
            models.Product.id,
            models.Product.name
        ).subquery()
        
        # Get average inventory
        avg_inventory = db.query(
            models.Product.id.label('product_id'),
            func.avg(models.Product.quantity).label('average_inventory')
        ).group_by(
            models.Product.id
        ).subquery()
        
        # Combine and calculate turnover rate
        turnover = db.query(
            models.Product.id.label('product_id'),
            models.Product.name.label('product_name'),
            func.coalesce(units_sold.c.units_sold, 0).label('units_sold'),
            func.coalesce(avg_inventory.c.average_inventory, 0).label('average_inventory')
        ).outerjoin(
            units_sold, units_sold.c.product_id == models.Product.id
        ).outerjoin(
            avg_inventory, avg_inventory.c.product_id == models.Product.id
        ).all()

        return {
            "turnover": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "units_sold": float(item.units_sold),
                    "average_inventory": float(item.average_inventory),
                    "turnover_rate": float(item.units_sold / item.average_inventory) if item.average_inventory > 0 else 0
                }
                for item in turnover
            ]
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid analysis type")
