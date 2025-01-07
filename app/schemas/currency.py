from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ExchangeRateBase(BaseModel):
    usd_to_iqd_rate: float = Field(..., gt=0, description="Exchange rate from USD to IQD")
    effective_date: Optional[datetime] = None

class ExchangeRateCreate(ExchangeRateBase):
    pass

class ExchangeRateResponse(ExchangeRateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
