from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
from enum import Enum

class BookingStatusEnum(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class BookingBase(BaseModel):
    service_id: uuid.UUID
    staff_id: Optional[uuid.UUID] = None
    room_id: Optional[uuid.UUID] = None
    start_time: datetime
    # Customer Info (Optionally provided during booking)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_id: Optional[uuid.UUID] = None # If existing customer

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: Optional[BookingStatusEnum] = None
    staff_id: Optional[uuid.UUID] = None
    room_id: Optional[uuid.UUID] = None
    start_time: Optional[datetime] = None

class BookingOut(BookingBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    # user_id: Optional[uuid.UUID] # Backend internal
    customer_id: Optional[uuid.UUID]
    end_time: datetime
    price_snapshot: float
    currency_snapshot: str
    commission_snapshot: Optional[float]
    status: BookingStatusEnum
    created_at: datetime

    # Nested objects for display
    service: Optional[ServiceOut] = None
    customer: Optional[CustomerOut] = None 
    
    class Config:
        from_attributes = True

# Service Schemas (Fast-track)
class ServiceCreate(BaseModel):
    name: str
    duration_minutes: int
    price: float
    currency: str = "EUR"

class ServiceOut(ServiceCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID
    
    class Config:
        from_attributes = True

# Staff Schemas (Fast-track)
class StaffCreate(BaseModel):
    name: str
    role: Optional[str] = None
    commission_rate: Optional[float] = None # Deprecated maybe? We use StaffCommission table now. But keep for simple legacy support if wanted.

class StaffOut(StaffCreate):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

# Customer Schemas (Fast-track)
class CustomerOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True
