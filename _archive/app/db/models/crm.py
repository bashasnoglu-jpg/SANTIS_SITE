import uuid
from datetime import datetime
from typing import Optional, Any

from sqlalchemy import String, Float, DateTime, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class GuestTrace(Base):
    """
    Core storage table for Phantom/Hover/Click traces.
    Uses JSONB for extensible payload tracking matching Phase 5 Sovereign CRM.
    """
    __tablename__ = "crm_guest_traces"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        index=True
    )
    
    session_id: Mapped[str] = mapped_column(String, index=True)
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    action_type: Mapped[str] = mapped_column(String, index=True) # e.g., hover, click, dwell
    target_element: Mapped[str] = mapped_column(String, index=True) # e.g., Rituel-Royal-Hamam
    
    # Store behavioral weights for immediate analytics
    intent_score: Mapped[float] = mapped_column(Float, default=0.0) 
    
    # JSON Payload for everything else (viewport coords, time spent ms, user_agent, referrer)
    payload: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index('idx_tenant_session_action', 'tenant_id', 'session_id', 'action_type'),
    )

    def __repr__(self):
        return f"<GuestTrace {self.action_type} on {self.target_element} Score:{self.intent_score}>"


class IntentSummary(Base):
    """
    Aggregated Intent View per session or user for fast Redis/Surge Engine lookup.
    """
    __tablename__ = "crm_intent_summaries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    session_id: Mapped[str] = mapped_column(String, index=True, unique=True)
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    last_updated: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # JSON mapping of { "service_slug": cumulative_score }
    # e.g. {"royal-hamam": 85.5, "thai-massage": 12.0}
    service_scores: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    
    # For quick high-level categorization
    dominant_intent: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    def __repr__(self):
        return f"<IntentSummary {self.session_id} Dominant:{self.dominant_intent}>"
