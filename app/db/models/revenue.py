import uuid
from sqlalchemy import Integer, Date, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date

from app.db.base import Base

class DailyRevenue(Base):
    __tablename__ = "daily_revenue"

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
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    
    daily_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    booking_count: Mapped[int] = mapped_column(Integer, default=0)

    tenant = relationship("Tenant")
