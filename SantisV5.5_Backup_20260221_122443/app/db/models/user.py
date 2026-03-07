import uuid
import enum
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base
# Avoid circular import if Tenant is needed, but for FK string reference it's fine.

class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    STAFF = "STAFF"
    USER = "USER"

from app.db.models.mixins import SoftDeleteMixin

class User(Base, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Platform Admin (Superuser but for business logic, ensures visibility across tenants)
    is_platform_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    
    token_version: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # RBAC & Multi-Tenancy
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER)
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=True
    )
    
    tenant = relationship("Tenant", back_populates="users")
