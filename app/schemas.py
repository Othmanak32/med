from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class StockMovementType(str, Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    DAMAGE = "damage"
    ADJUSTMENT = "adjustment"
    RETURN = "return"

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    price_iqd: float
    price_usd: float
    current_stock: int = 0

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    image_url: Optional[str] = None
    last_stock_update: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Stock Movement schemas
class StockMovementBase(BaseModel):
    product_id: int
    movement_type: StockMovementType
    quantity: int
    reference_id: str
    notes: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovement(StockMovementBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Supplier schemas
class SupplierBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Purchase Invoice schemas
class PurchaseInvoiceItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price_iqd: float
    unit_price_usd: float

class PurchaseInvoiceItem(PurchaseInvoiceItemBase):
    id: int
    total_price_iqd: float
    total_price_usd: float

    class Config:
        from_attributes = True

class PurchaseInvoiceCreate(BaseModel):
    supplier_id: int
    items: List[PurchaseInvoiceItemBase]
    notes: Optional[str] = None

class PurchaseInvoice(BaseModel):
    id: int
    invoice_number: str
    supplier_id: int
    date: datetime
    total_amount_iqd: float
    total_amount_usd: float
    notes: Optional[str] = None
    items: List[PurchaseInvoiceItem]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Sales Invoice schemas
class SalesInvoiceItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price_iqd: float
    unit_price_usd: float

class SalesInvoiceItem(SalesInvoiceItemBase):
    id: int
    total_price_iqd: float
    total_price_usd: float

    class Config:
        from_attributes = True

class SalesInvoiceCreate(BaseModel):
    customer_id: int
    items: List[SalesInvoiceItemBase]
    discount_amount: Optional[float] = 0
    payment_method: str
    notes: Optional[str] = None

class SalesInvoice(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    date: datetime
    subtotal_iqd: float
    subtotal_usd: float
    discount_amount: float
    total_amount_iqd: float
    total_amount_usd: float
    payment_method: str
    notes: Optional[str] = None
    items: List[SalesInvoiceItem]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Settings schemas
class Settings(BaseModel):
    usd_to_iqd_rate: float
    updated_at: datetime

    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    type: str
    amount_iqd: float
    amount_usd: float
    date: datetime
    description: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True
