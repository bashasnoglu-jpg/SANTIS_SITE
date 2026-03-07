import uuid
import enum
from typing import Optional
from sqlalchemy import ForeignKey, String, DateTime, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base

class SlotStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    HELD = "HELD" # 5-minute checkout window
    BOOKED = "BOOKED"
    UNAVAILABLE = "UNAVAILABLE" # Staff break, maintenance, etc.

class PrecomputedSlot(Base):
    """
    Phase 4: High-Performance Concurrent Booking Engine.
    Instead of calculating overlaps on the fly, slots are physically generated in the DB.
    """
    __tablename__ = "precomputed_slots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    
    # Relationships
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )
    staff_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff.id"),
        nullable=True, # Might be any staff
        index=True
    )
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resources.id"),
        nullable=True, # E.g., Stone Table 1
        index=True
    )

    # Time bounds
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # State tracking for atomic transactions
    status: Mapped[SlotStatus] = mapped_column(
        Enum(SlotStatus), 
        default=SlotStatus.AVAILABLE, 
        nullable=False,
        index=True
    )
    
    # If HELD or BOOKED, which booking ID owns this?
    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id"),
        nullable=True
    )
    
    # When does the HELD status expire?
    held_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # A constraint to ensure we don't accidentally generate absolute duplicate slots for the same resource
    __table_args__ = (
        UniqueConstraint('tenant_id', 'service_id', 'staff_id', 'resource_id', 'start_time', name='uix_slot_identity'),
    )

    tenant = relationship("Tenant")
    service = relationship("app.db.models.service.Service")
    staff = relationship("app.db.models.staff.Staff")
    resource = relationship("app.db.models.resource.Resource")
    booking = relationship("app.db.models.booking.Booking")
