"""
app/db/models/revenue_score.py
Phase 17: Revenue Oracle — Behavioral Score Persistence
Stores every Oracle scoring event for the self-learning feedback loop.
SQLite-compatible (String UUID primary key).
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Boolean, JSON, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RevenueScore(Base):
    __tablename__ = "revenue_scores"

    # SQLite-compatible UUID as String
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Guest/Session identification
    session_id:    Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    guest_name:    Mapped[str] = mapped_column(String(255), nullable=True)
    tenant_id:     Mapped[str] = mapped_column(String(64), nullable=True, index=True)

    # Core scoring
    composite_score: Mapped[float] = mapped_column(Float, nullable=False)
    tier:            Mapped[str]   = mapped_column(String(32), nullable=False)  # whale/hot_lead/warm_lead/curious/explorer
    is_whale:        Mapped[bool]  = mapped_column(Boolean, default=False, index=True)

    # Component scores (for model improvement / self-learning)
    intent_component:   Mapped[float] = mapped_column(Float, default=0.0)
    recency_component:  Mapped[float] = mapped_column(Float, default=0.0)
    aov_component:      Mapped[float] = mapped_column(Float, default=0.0)
    behavior_component: Mapped[float] = mapped_column(Float, default=0.0)

    # Context
    service_interest:  Mapped[str]  = mapped_column(String(255), nullable=True)
    behavioral_tags:   Mapped[dict] = mapped_column(JSON, nullable=True)   # stored as list
    nudge_type:        Mapped[str]  = mapped_column(String(64), nullable=True)
    nudge_message:     Mapped[str]  = mapped_column(Text, nullable=True)

    # Feedback loop (self-learning): None = unknown, True = booked, False = did not book
    booked:     Mapped[bool] = mapped_column(Boolean, nullable=True)
    booking_id: Mapped[str]  = mapped_column(String(128), nullable=True)

    scored_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=datetime.utcnow, index=True
    )
