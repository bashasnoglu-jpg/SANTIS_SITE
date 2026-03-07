from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

class TenantBase(BaseModel):
    name: str
    country: Optional[str] = None
    is_active: Optional[bool] = True

class TenantCreate(TenantBase):
    pass

class TenantUpdate(TenantBase):
    pass

class TenantInDBBase(TenantBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class Tenant(TenantInDBBase):
    pass
