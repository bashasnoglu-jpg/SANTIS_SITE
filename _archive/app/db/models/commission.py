import uuid
import enum
from sqlalchemy import String, ForeignKey, Numeric, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional

from app.db.base import Base

class CommissionType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"

class StaffCommission(Base):
    __tablename__ = "staff_commissions"

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
    staff_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff.id"),
        nullable=False
    )
    service_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id"),
        nullable=True # Null means applies to ALL services unless overridden
    )
    
    type: Mapped[CommissionType] = mapped_column(Enum(CommissionType), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False) # e.g. 10.0 for 10% or 10 EUR
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")
    staff = relationship("app.db.models.staff.Staff")
    service = relationship("app.db.models.service.Service")
