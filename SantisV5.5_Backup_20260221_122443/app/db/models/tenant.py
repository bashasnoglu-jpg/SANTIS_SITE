import uuid
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.db.base import Base

from app.db.models.mixins import SoftDeleteMixin

class Tenant(Base, SoftDeleteMixin):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    from typing import TYPE_CHECKING
    if TYPE_CHECKING:
        from .user import User
    from sqlalchemy.orm import relationship
    users = relationship("User", back_populates="tenant")
