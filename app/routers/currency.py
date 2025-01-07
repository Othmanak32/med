from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime
from ..database import get_db
from ..models.currency import ExchangeRate
from ..schemas.currency import ExchangeRateCreate, ExchangeRateResponse
from ..auth.utils import get_current_active_user

router = APIRouter()

@router.post("/exchange-rates/", response_model=ExchangeRateResponse)
def create_exchange_rate(
    rate: ExchangeRateCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new exchange rate entry"""
    db_rate = ExchangeRate(
        usd_to_iqd_rate=rate.usd_to_iqd_rate,
        effective_date=rate.effective_date or datetime.now()
    )
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate

@router.get("/exchange-rates/current/", response_model=ExchangeRateResponse)
def get_current_exchange_rate(
    db: Session = Depends(get_db)
):
    """Get the most recent exchange rate"""
    rate = db.query(ExchangeRate).order_by(desc(ExchangeRate.effective_date)).first()
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No exchange rate found"
        )
    return rate

@router.get("/exchange-rates/", response_model=List[ExchangeRateResponse])
def get_exchange_rates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of exchange rates"""
    rates = db.query(ExchangeRate).order_by(desc(ExchangeRate.effective_date)).offset(skip).limit(limit).all()
    return rates
