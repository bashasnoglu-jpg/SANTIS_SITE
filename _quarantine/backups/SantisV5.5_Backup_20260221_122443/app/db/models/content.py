from sqlalchemy import Column, Integer, String, DateTime, JSON, UniqueConstraint, Index
from sqlalchemy.sql import func
from app.db.base import Base

class ContentRegistry(Base):
    __tablename__ = "content_registry"
    id = Column(String, primary_key=True, index=True)
    slug = Column(String, index=True)
    region = Column(String, index=True)
    locale = Column(String)
    active_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('slug', 'region', 'locale', name='_slug_region_locale_uc'),
    )

class ContentAuditLog(Base):
    __tablename__ = "content_audit_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String)
    region = Column(String)
    actor = Column(String)
    action = Column(String)
    hash = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)

    __table_args__ = (
        Index('idx_slug_region_audit', 'slug', 'region'),
    )

class DraftRegistry(Base):
    __tablename__ = "draft_registry"
    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String, index=True)
    region = Column(String, index=True)
    locale = Column(String)
    draft_hash = Column(String)  # Pointer to the blob in /storage
    actor = Column(String)
    status = Column(String, default="PENDING_REVIEW") # PENDING_REVIEW, APPROVED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class RedirectRegistry(Base):
    """
    Otonom 301 Redirect Haritası (Blok D4 SEO Engine)
    Tracks slug changes and redirects old slugs to new slugs to preserve SEO value.
    """
    __tablename__ = "redirect_registry"
    id = Column(Integer, primary_key=True, autoincrement=True)
    old_slug = Column(String, index=True, unique=True)
    new_slug = Column(String, index=True)
    region = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
