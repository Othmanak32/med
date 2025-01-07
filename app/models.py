from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # admin, sales, inventory
    is_active = Column(Boolean, default=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    sku = Column(String, unique=True, index=True)
    price_iqd = Column(Float)  # Price in Iraqi Dinar
    price_usd = Column(Float)  # Price in USD
    image_url = Column(String, nullable=True)
    current_stock = Column(Integer, default=0)
    last_stock_update = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StockMovementType(enum.Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    DAMAGE = "damage"
    ADJUSTMENT = "adjustment"
    RETURN = "return"

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    movement_type = Column(Enum(StockMovementType))
    quantity = Column(Integer)
    reference_id = Column(String)  # Invoice or document reference
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product")
    user = relationship("User")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PurchaseInvoice(Base):
    __tablename__ = "purchase_invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    date = Column(DateTime, default=datetime.utcnow)
    total_amount_iqd = Column(Float)
    total_amount_usd = Column(Float)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    supplier = relationship("Supplier")
    items = relationship("PurchaseInvoiceItem")

class PurchaseInvoiceItem(Base):
    __tablename__ = "purchase_invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("purchase_invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price_iqd = Column(Float)
    unit_price_usd = Column(Float)
    total_price_iqd = Column(Float)
    total_price_usd = Column(Float)
    
    product = relationship("Product")

class SalesInvoice(Base):
    __tablename__ = "sales_invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    date = Column(DateTime, default=datetime.utcnow)
    subtotal_iqd = Column(Float)
    subtotal_usd = Column(Float)
    discount_amount = Column(Float, default=0)
    total_amount_iqd = Column(Float)
    total_amount_usd = Column(Float)
    payment_method = Column(String)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer")
    items = relationship("SalesInvoiceItem")

class SalesInvoiceItem(Base):
    __tablename__ = "sales_invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("sales_invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price_iqd = Column(Float)
    unit_price_usd = Column(Float)
    total_price_iqd = Column(Float)
    total_price_usd = Column(Float)
    
    product = relationship("Product")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    usd_to_iqd_rate = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # revenue, expense
    amount_iqd = Column(Float)
    amount_usd = Column(Float)
    date = Column(DateTime)
    description = Column(Text)
    reference_type = Column(String, nullable=True)  # sales_invoice, purchase_invoice, etc.
    reference_id = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
