import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.base import Base

class ConsentType(str, enum.Enum):
    MARKETING_EMAIL = "MARKETING_EMAIL"
    MARKETING_SMS = "MARKETING_SMS"
    DATA_PROCESSING = "DATA_PROCESSING"
    CROSS_BORDER_TRANSFER = "CROSS_BORDER_TRANSFER"

class UserConsent(Base):
    __tablename__ = "user_consents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=False,
        index=True
    )
    consent_type: Mapped[ConsentType] = mapped_column(
        Enum(ConsentType),
        nullable=False
    )
    is_granted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Audit trail for GDPR/KVKK compliance
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    granted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    customer = relationship("app.db.models.customer.Customer", back_populates="consents")
