import uuid
import enum
from typing import Optional
from sqlalchemy import ForeignKey, String, DateTime, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base
from app.db.models.user import User
from app.db.models.tenant import Tenant
# Forward references or string references used for mapped relationships

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

from app.db.models.mixins import SoftDeleteMixin

class Booking(Base, SoftDeleteMixin):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False
    )
    # Customer
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True # Legacy or for internal booking?
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=True # Must be populated for guest bookings
    )
    
    # Core Booking Details
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id"),
        nullable=False
    )
    staff_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff.id"),
        nullable=True # Staff might be assigned later
    )
    room_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rooms.id"),
        nullable=True # Room might be assigned later
    )
    
    # Timing
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    
    # Financials
    price_snapshot: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency_snapshot: Mapped[str] = mapped_column(String(3), default="EUR")
    commission_snapshot: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), default=0.0)
    
    # Status
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), 
        default=BookingStatus.PENDING, 
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    tenant = relationship("Tenant")
    customer = relationship("app.db.models.customer.Customer")
    service = relationship("app.db.models.service.Service")
    staff = relationship("app.db.models.staff.Staff")
    room = relationship("app.db.models.room.Room")
