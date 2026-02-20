from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, List

from app.api import deps
from app.schemas import tenant as schemas
from app.db.models.tenant import Tenant
from app.db.session import get_db
from app.services.audit import AuditService, AuditAction, AuditStatus

router = APIRouter()

@router.get("/", response_model=List[schemas.Tenant])
async def read_tenants(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: deps.models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve tenants. Filters out soft-deleted tenants.
    """
    result = await db.execute(select(Tenant).where(Tenant.is_deleted == False).offset(skip).limit(limit))
    tenants = result.scalars().all()
    return tenants

@router.post("/", response_model=schemas.Tenant)
async def create_tenant(
    *,
    db: AsyncSession = Depends(get_db),
    tenant_in: schemas.TenantCreate,
    current_user: deps.models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new tenant.
    """
    result = await db.execute(select(Tenant).where(Tenant.name == tenant_in.name))
    existing_tenant = result.scalar_one_or_none()
    if existing_tenant:
        raise HTTPException(
            status_code=400,
            detail="The tenant with this name already exists in the system.",
        )
        
    tenant = Tenant(
        name=tenant_in.name,
        country=tenant_in.country,
        is_active=tenant_in.is_active,
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant

from app.core.permissions import Permission

@router.delete("/{tenant_id}", status_code=status.HTTP_200_OK)
async def delete_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: deps.models.User = Depends(deps.require_permission(Permission.TENANT_MANAGE)),
) -> Any:
    """
    Soft delete a tenant.
    """
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if already deleted
    if tenant.is_deleted:
        raise HTTPException(status_code=409, detail="Tenant already deleted")

    # Soft Delete Logic
    tenant.is_deleted = True
    tenant.deleted_at = datetime.utcnow()
    # current_user.id is UUID, tenant.deleted_by is UUID in mixin
    tenant.deleted_by = current_user.id
    
    # Audit Log
    await AuditService.log(
        db=db,
        action=AuditAction.DELETE,
        actor_id=current_user.id,
        tenant_id=tenant.id,
        entity_type="Tenant",
        entity_id=tenant.id,
        details={"soft_delete": True, "name": tenant.name},
        status=AuditStatus.SUCCESS
    )

    await db.commit()
    return {"status": "success", "message": "Tenant soft deleted"}
