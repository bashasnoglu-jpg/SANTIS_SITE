import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional, Dict, Any

from app.db.base import Base

class SovereignEvent(Base):
    """
    Sovereign Event Bus: YC & Stripe Grade Analytics Backbone.
    Stores all operational, financial, and behavioral events.
    """
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True, nullable=True)
    
    # Context
    user_id: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True) # Guest or Admin ID
    session_id: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True) # Ghost Context ID
    
    # Event Naming Bible: object_action (e.g. booking_created)
    event_name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    
    # 🎯 The Magic Payload
    metadata_payload: Mapped[dict] = mapped_column(JSONB, default={}, nullable=False) 
    
    # Telemetry
    device_fingerprint: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Fast Analytical Indexes
    __table_args__ = (
        Index('ix_events_name_time', 'event_name', 'created_at'),
    )
