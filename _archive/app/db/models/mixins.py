from datetime import datetime
import uuid
from typing import Optional
from sqlalchemy import Column, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

class SoftDeleteMixin:
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    # Storing UUID directly to avoid circular dependency issues and complexity with FKs for now
    deleted_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

class TenantAwareMixin:
    """
    Sovereign OS: Multi-Tenant İzolasyon Katmanı (Row-Level Security Foundation).
    Bu mixin'i miras alan her model, otomatik olarak bir tenant_id'ye sahip olur.
    """
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        index=True, 
        nullable=True # SQLite uyumluluğu ve sistem verileri (HQ) için şimdilik nullable
    )
    
    # Global flag: Eğer True ise bu veri tüm Tenant'larda ortak gösterilebilir (Örn: Default bir masaj türü)
    is_global: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default='false')
