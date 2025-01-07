from pydantic_settings import BaseSettings
from typing import Optional

class ProductionSettings(BaseSettings):
    # Database settings
    DATABASE_URL: str
    
    # Security settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS settings
    ALLOWED_ORIGINS: list = ["https://yourdomain.com"]
    
    # File storage settings
    UPLOAD_DIR: str = "uploads"
    BACKUP_DIR: str = "backups"
    
    # Currency settings
    DEFAULT_CURRENCY: str = "USD"
    
    # Company information
    COMPANY_NAME: str
    COMPANY_ADDRESS: str
    COMPANY_PHONE: str
    COMPANY_EMAIL: str
    
    # Email settings (for notifications)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Backup settings
    BACKUP_RETENTION_DAYS: int = 30
    S3_BACKUP_BUCKET: Optional[str] = None
    
    class Config:
        env_file = ".env.production"
