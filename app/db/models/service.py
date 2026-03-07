import uuid
from sqlalchemy import String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional

from app.db.base import Base

from app.db.models.mixins import SoftDeleteMixin

class Service(Base, SoftDeleteMixin):
    __tablename__ = "services"

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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Phase V11: Omni-Lingo (JSONB Translations)
    name_translations: Mapped[dict] = mapped_column(JSONB, default=dict, server_default='{}')
    desc_translations: Mapped[dict] = mapped_column(JSONB, default=dict, server_default='{}')
    
    duration_minutes: Mapped[int] = mapped_column(nullable=False)
    
    # Base configuration
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False) # Base Price
    currency: Mapped[str] = mapped_column(String(3), default="EUR", nullable=False)
    
    # Phase 5: Cognitive Yield Bounds
    current_price_eur: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True) # Actively fluctuating price
    min_price_eur: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True) # Quiet Luxury Guardrail
    max_price_eur: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True) # Price Gouging Ceiling
    demand_multiplier: Mapped[float] = mapped_column(Numeric(4, 2), default=1.0, server_default="1.0") # Active multiplier
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")
