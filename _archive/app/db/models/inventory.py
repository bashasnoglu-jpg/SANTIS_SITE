"""
app/db/models/inventory.py
Phase O – Inventory Scarcity Engine
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ServiceInventory(Base):
    """
    Logical inventory per service item.
    When current_stock <= min_threshold → Scarcity Surge triggered in Phase J.
    """
    __tablename__ = "service_inventory"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    item_name:     Mapped[str]  = mapped_column(String(255), nullable=False)   # "Sothys Gold Oil"
    unit:          Mapped[str]  = mapped_column(String(32), default="pcs")     # ml | pcs | sets
    current_stock: Mapped[int]  = mapped_column(Integer, default=10)
    min_threshold: Mapped[int]  = mapped_column(Integer, default=3)            # below = CRITICAL
    is_luxury:     Mapped[bool] = mapped_column(Boolean, default=False)        # luxury → bigger bump
    notes:         Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at:    Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    service = relationship("Service", lazy="select")

    @property
    def is_critical(self) -> bool:
        return self.current_stock <= self.min_threshold

    @property
    def scarcity_bump(self) -> float:
        """Extra multiplier when critical."""
        if not self.is_critical:
            return 0.0
        return 0.25 if self.is_luxury else 0.10
