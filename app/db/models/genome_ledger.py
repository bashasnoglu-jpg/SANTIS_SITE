from typing import Optional, List
from datetime import datetime
import hashlib
from decimal import Decimal

from sqlalchemy import String, Integer, DateTime, JSON, Boolean, Numeric, ARRAY, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base

class GuestGenomeLedger(Base):
    """
    Phase 40: Whale Watcher 2.0 (The Guest Genome Ledger)
    This creates an anonymized, cross-tenant identification system for VIP Guests.
    Under KVKK/GDPR, real names should NOT be shared between distinct hotel tenants.
    Instead, we use a SHA-256 Hash derived from (Email + Phone) as a Sovereign Passport.
    """
    __tablename__ = "guest_genome_ledger"

    # The SHA-256 identifier acting as the "Sovereign Passport"
    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    
    # Origin Tenant that first discovered this Whale
    origin_tenant_id: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # VIP metrics & Affinity Scores (No PII) 
    vip_tier: Mapped[str] = mapped_column(String(50), default="STANDARD") # e.g., WHALE, SOVEREIGN, NOMINAL
    lifetime_value_eur: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal('0.0'))
    
    # Autonomous Traits / Behavioral Data 
    # E.g., ["PREFERS_CRYPTO", "SPA_AFTERNOON", "DEEP_TISSUE_LOVER", "PRICE_INSENSITIVE"]
    behavioral_tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    
    # Risk or Ghost Scores from cross-tenant visits
    cumulative_ghost_score: Mapped[int] = mapped_column(Integer, default=50) # Scale 0-100 (100 = Guaranteed Conversion)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    @staticmethod
    def generate_sovereign_hash(email: str, phone: str = "") -> str:
        """
        Creates a deterministic hash without storing the actual PII.
        Salted with a strict protocol string.
        """
        raw_identity = f"SOVEREIGN_V1_{email.strip().lower()}_{phone.strip()}"
        return hashlib.sha256(raw_identity.encode('utf-8')).hexdigest()
