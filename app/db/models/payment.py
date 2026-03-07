import uuid
import enum
from typing import Optional, Any
from sqlalchemy import ForeignKey, String, DateTime, Numeric, Enum, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base

class PaymentProvider(str, enum.Enum):
    STRIPE = "STRIPE"
    IYZICO = "IYZICO"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PAID = "PAID"  # Added for Stripe Checkout Vault

class TenantPaymentConfig(Base):
    __tablename__ = "tenant_payment_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    provider: Mapped[PaymentProvider] = mapped_column(
        Enum(PaymentProvider),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Credentials
    public_key: Mapped[str] = mapped_column(String(255), nullable=False)
    secret_key: Mapped[str] = mapped_column(String(255), nullable=False)
    webhook_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id"),
        nullable=False,
        index=True
    )
    provider: Mapped[PaymentProvider] = mapped_column(
        Enum(PaymentProvider),
        nullable=False
    )
    provider_transaction_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False
    )
    
    # Shield: prevent double-charging
    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    
    # Phase 8: Smart Offer Engine
    applied_offer_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    discount_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Phase 7: The Double Kill - Store conversion intent (Surge multiplier info etc)
    ghost_trace_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant")
    booking = relationship("app.db.models.booking.Booking")

# Phase 68: Checkout Vault
class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"), # Using customers as the user table in Santis OS
        nullable=False,
        index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False
    )
    
    stripe_intent_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("app.db.models.customer.Customer")
