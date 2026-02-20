import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Any

from sqlalchemy import String, DateTime, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class AuditAction(str, Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    EXPORT = "EXPORT"
    SCAN = "SCAN"
    FIX = "FIX"
    SECURITY = "SECURITY"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    OTHER = "OTHER"

class AuditStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    FAILURE = "FAILURE" # Alias for robustness

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        index=True
    )
    
    # Context
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=True,
        index=True
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )
    
    # Action Details
    # Storing Enums as Strings for database portability (SQLite/Postgres)
    action: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[str] = mapped_column(String, default=AuditStatus.SUCCESS.value)
    
    # Target Entity
    entity_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    # Payload
    # Using JSON variant for Postgres, robust enough for SQLite as Text/JSON
    details: Mapped[Optional[Any]] = mapped_column(JSON().with_variant(JSON, "postgresql"), nullable=True)

    # Clean string representation
    def __repr__(self):
        return f"<AuditLog {self.action} by {self.actor_id} at {self.timestamp}>"
