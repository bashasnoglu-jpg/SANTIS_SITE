"""
app/db/models/gallery.py
Phase Visual — GalleryAsset Model
Sovereign Media Infrastructure: tenant inheritance, priority scoring, slot-based resolution.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text
from app.db.base import Base


class GalleryAsset(Base):
    __tablename__ = "gallery_assets"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id       = Column(String(64), nullable=True)   # SaaS Isolation (no FK - VARCHAR/UUID mismatch)
    filename        = Column(String(255), nullable=False)
    filepath        = Column(String(512), nullable=False)
    category        = Column(String(32),  nullable=False, index=True)
    caption_tr      = Column(Text, default="")
    caption_en      = Column(Text, default="")
    caption_de      = Column(Text, default="")
    linked_service_id = Column(String(36), nullable=True)
    slot            = Column(String(50), nullable=True, index=True)
    blurhash        = Column(String(64), nullable=True)
    cdn_url         = Column(String(512), nullable=True)
    sort_order      = Column(Integer, default=0)
    is_published    = Column(Boolean, default=True)
    uploaded_at     = Column(DateTime, default=datetime.utcnow)

    # ── Sovereign Media Infrastructure (SII) ──
    is_global       = Column(Boolean, default=False, index=True)   # True = Master/Global asset
    priority        = Column(Integer, default=0)                    # Higher = wins in slot resolution
    alt_text        = Column(Text, nullable=True)                   # SEO & accessibility
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

