import uuid
from sqlalchemy import String, Boolean, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional

from app.db.base import Base
from app.db.models.mixins import SoftDeleteMixin

class TenantConfig(Base, SoftDeleteMixin):
    __tablename__ = "tenant_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        unique=True,
        nullable=False
    )
    
    # SaaS Revenue Settings
    min_ghost_score_for_rescue: Mapped[int] = mapped_column(Integer, default=85)
    surge_multiplier_base: Mapped[float] = mapped_column(Numeric(4, 2), default=1.0)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Phase 82.1: The AI Multiverse (LLM Persona Isolation)
    ai_persona_type: Mapped[str] = mapped_column(String(50), default="santis_healer") # santis_healer, zenith_aristocrat, omega_zen
    ai_system_prompt_override: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)
    
    # Global Settings
    default_currency: Mapped[str] = mapped_column(String(3), default="EUR")
    brand_color_primary: Mapped[str] = mapped_column(String(7), default="#d4af37")
    brand_logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    brand_display_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)


    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
