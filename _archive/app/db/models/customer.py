import uuid
from sqlalchemy import String, Integer, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from sqlalchemy import TypeDecorator
from cryptography.fernet import Fernet
import os

# Generate a default key if missing (DEV ONLY). 
# In Prod, MUST be set in .env!
ENCRYPTION_KEY = os.getenv("DB_ENCRYPTION_KEY", Fernet.generate_key().decode('utf-8'))
f = Fernet(ENCRYPTION_KEY.encode('utf-8'))

class EncryptedString(TypeDecorator):
    """
    Symmetric Encryption for PII Data (GDPR/KVKK Compliance).
    Transparently encrypts on INSERT/UPDATE, decrypts on SELECT.
    """
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return f.encrypt(value.encode('utf-8')).decode('utf-8')
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return f.decrypt(value.encode('utf-8')).decode('utf-8')
            except Exception:
                # Fallback for unencrypted legacy data during transition
                return value
        return value

from app.db.base import Base

class Customer(Base):
    __tablename__ = "customers"

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
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # GDPR Vault: Encrypted At Rest
    email: Mapped[Optional[str]] = mapped_column(EncryptedString(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(EncryptedString(50), nullable=True, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # V6 Sentient Profile (Pinecone / Local DB Hybrid Storage)
    ai_persona_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── PHASE P: Concierge Memory ──────────────────────────────
    preferences_json: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment='JSON: {"temp": 42, "allergy": "lavender", "pressure": "firm"}'
    )
    ai_notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment='Gemini real-time observation: mood, stress level, special needs'
    )
    vibe_check: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True,
        comment='Last known mood: calm | tense | relaxed | guarded'
    )
    medical_notes: Mapped[Optional[str]] = mapped_column(
        EncryptedString(512), nullable=True,
        comment='ENCRYPTED: allergies, injuries, contraindications'
    )
    # ──────────────────────────────────────────────────────────────

    # CRM Stats
    visit_count: Mapped[int] = mapped_column(Integer, default=0)
    total_spent: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    last_visit: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")
    bookings = relationship("app.db.models.booking.Booking", back_populates="customer")
    consents = relationship("app.db.models.consent.UserConsent", back_populates="customer", cascade="all, delete-orphan")
