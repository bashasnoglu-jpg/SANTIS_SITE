from sqlalchemy import Column, String, Float, Boolean, JSON, Integer
from app.db.base_class import Base

class GuestGenome(Base):
    """
    Phase 39: Whale Watcher (Global Guest Genome)
    Stores anonymized guest profiles (VIPs, Whales) that can be queried 
    across different tenants without violating GDPR/KVKK.
    """
    __tablename__ = "guest_genomes"

    id = Column(Integer, primary_key=True, index=True)
    
    # SHA-256 hashed unique identity (e.g., hash of email+phone)
    # This ensures PII is never stored in the global cross-tenant graph.
    guest_hash = Column(String(64), unique=True, index=True, nullable=False)
    
    # AI-Derived metrics from Revenue Brain
    vip_affinity = Column(Float, default=0.0) # 0.0 to 1.0
    lifetime_value_tier = Column(String(50), default="STANDARD") # e.g. WHALE, PREMIUM
    
    # Interests like "Wellness", "Suite", "Hammam" (No personal details)
    interests = Column(JSON, default=list) 
    
    # Is this guest allowed to be recognized globally across Sovereign Tenants?
    is_global_sovereign = Column(Boolean, default=False)
