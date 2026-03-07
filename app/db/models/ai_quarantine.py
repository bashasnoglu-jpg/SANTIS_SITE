from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from sqlalchemy.dialects.postgresql import UUID
import uuid

from .tenant_config import Base

# [SOVEREIGN SEAL: THE COMMAND CENTER - AI QUARANTINE SCHEMA]

class QuarantineStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class AssetType(str, enum.Enum):
    IMAGE = "IMAGE"
    TEXT = "TEXT"
    SEO = "SEO"

class AIQuarantineAsset(Base):
    """
    Santis OS - Karantina Odası (God Mode Panel)
    Yapay zekanın (DALL-E 3 / GPT-4) otonom ürettiği içerikler anında yayına çıkmaz.
    Önce bu tabloya düşer. Command Center'da "Mühürle" dendiğinde canlıya ('assets/') taşınır.
    """
    __tablename__ = "ai_quarantine_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Çoklu Kiracı İzolasyonu (SaaS)
    tenant_id = Column(String(50), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    asset_type = Column(Enum(AssetType), default=AssetType.IMAGE, nullable=False)
    
    # Hangi HTML slotunu, medya ismini onaracak? (Örn: santis_hero_v1.webp)
    target_filename = Column(String(255), nullable=False)
    target_slot_id = Column(String(255), nullable=True) # data-santis-slot eşleşmesi
    
    # Medya İçeriği (GridFS, R2, S3 veya geçici tmp dosya yolu)
    # Onaydan önce public_html içine konmaması gerektiği için geçici bir Vault alanında tutulur
    vault_uri = Column(String(2048), nullable=True) 
    
    # Prompting ve Zeka Metadataları (Öğrenme için iz bırakıyoruz)
    ai_prompt_used = Column(String, nullable=True)
    ai_model = Column(String(50), default="dall-e-3") # Veya gpt-4-turbo
    
    # Optimizasyon Karşılığı
    size_kb = Column(Float, nullable=True) # 150.5 vb.
    
    # Human in the Loop (HITL) Mühürü
    status = Column(Enum(QuarantineStatus), default=QuarantineStatus.PENDING, index=True)
    
    # Denetim ve Faturalandırma (Stripe Metered Billing entegrasyonu için)
    # Reddedilenleri fatura etmeyebilir veya üretime göre kontör düşebiliriz
    billing_cost_cents = Column(Integer, default=400) # DALL-E 3 HD ortalama maliyeti ($0.04 -> 4 cents veya mark-up ile)
    billed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    
    # İlişki Bağlantıları
    tenant = relationship("Tenant", backref="quarantined_assets")
