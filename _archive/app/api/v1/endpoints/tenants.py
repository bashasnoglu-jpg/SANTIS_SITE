from __future__ import annotations
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, List

from app.api import deps
from app.schemas import tenant as schemas
from app.db.models.tenant import Tenant
from app.db.session import get_db, get_db_for_admin
from app.services.audit import AuditService, AuditAction, AuditStatus

router = APIRouter()


@router.get("/", response_model=List[schemas.Tenant])
async def read_tenants(
    db: AsyncSession = Depends(get_db_for_admin),
    skip: int = 0,
    limit: int = 100,
    current_user: deps.models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Retrieve tenants. Filters out soft-deleted tenants."""
    result = await db.execute(
        select(Tenant).where(Tenant.is_deleted == False).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=schemas.Tenant)
async def create_tenant(
    *,
    db: AsyncSession = Depends(get_db_for_admin),
    tenant_in: schemas.TenantCreate,
    current_user: deps.models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Create new tenant (superuser only)."""
    result = await db.execute(select(Tenant).where(Tenant.name == tenant_in.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="The tenant with this name already exists.")

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
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.require_permission(Permission.TENANT_MANAGE)),
) -> Any:
    """Soft delete a tenant."""
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if tenant.is_deleted:
        raise HTTPException(status_code=409, detail="Tenant already deleted")

    tenant.is_deleted = True
    tenant.deleted_at = datetime.utcnow()
    tenant.deleted_by = current_user.id

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


# ─────────────────────────────────────────────────────────────────────────────
# 🏛️ SOVEREIGN ONBOARDING — POST /register
# Yeni işletme kaydı: Tenant + OWNER User + JWT tek seferde oluşturur
# ─────────────────────────────────────────────────────────────────────────────
from app.db.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token


@router.post(
    "/register",
    response_model=schemas.TenantRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni İşletme Kaydı (SaaS Onboarding)",
)
async def register_tenant(
    *,
    db: AsyncSession = Depends(get_db_for_admin),
    data: schemas.TenantRegister,
) -> Any:
    """
    Public endpoint — Auth gerektirmez.

    Tek çağrıda:
    1. Tenant oluşturur (işletme)
    2. OWNER rolünde kullanıcı oluşturur
    3. JWT access token döndürür (hemen kullanıma hazır)
    """

    # 1. İşletme adı çakışma kontrolü
    existing = await db.execute(
        select(Tenant).where(Tenant.name == data.spa_name, Tenant.is_deleted == False)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"'{data.spa_name}' adında bir işletme zaten kayıtlı."
        )

    # 2. E-posta çakışma kontrolü
    existing_user = await db.execute(
        select(User).where(User.email == data.owner_email)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu e-posta adresi zaten kullanımda."
        )

    # 3. Tenant oluştur
    # Slug olustur (subdomain: spa-antalya gibi)
    import re as _re
    _slug = _re.sub(r'[^a-z0-9-]', '-', data.spa_name.lower().strip())[:80]
    _slug = _re.sub(r'-+', '-', _slug).strip('-')
    # Unique yap
    _slug_final = getattr(data, 'subdomain', None) or _slug

    tenant = Tenant(
        name=data.spa_name,
        country=data.country,
        slug=_slug_final,
        subdomain=_slug_final,
        is_active=True,
    )
    db.add(tenant)
    await db.flush()  # ID'yi commit olmadan al

    # 4. Owner user oluştur
    owner = User(
        email=data.owner_email,
        hashed_password=get_password_hash(data.owner_password),
        is_active=True,
        is_superuser=False,
        is_platform_admin=False,
        role=UserRole.OWNER,
        tenant_id=tenant.id,
        token_version=1,
    )
    db.add(owner)
    await db.commit()
    await db.refresh(tenant)
    await db.refresh(owner)

    # 5. Audit log
    await AuditService.log(
        db=db,
        action=AuditAction.CREATE,
        actor_id=owner.id,
        tenant_id=tenant.id,
        entity_type="Tenant",
        entity_id=tenant.id,
        details={
            "event": "onboarding_complete",
            "subdomain": data.subdomain,
            "spa_type": data.spa_type,
            "owner_email": data.owner_email,
        },
        status=AuditStatus.SUCCESS
    )
    await db.commit()

    # 6. JWT token oluştur
    access_token = create_access_token(
        subject=str(owner.id),
        token_version=owner.token_version,
        role=owner.role.value,
        tenant_id=str(tenant.id),
    )

    return schemas.TenantRegisterResponse(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        subdomain=data.subdomain,
        owner_email=owner.email,
        access_token=access_token,
        message=f"'{data.spa_name}' başarıyla oluşturuldu. Hoş geldiniz! 🏛️"
    )


@router.get("/resolve", summary="Slug/Subdomain → Tenant UUID")
async def resolve_tenant_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db_for_admin),
):
    """
    Frontend handshake endpoint.
    GET /api/v1/tenants/resolve?slug=santis-club-hq
    Yerel/global data-bridge.js bu endpoint ile tenant_id alir.
    """
    from sqlalchemy import or_
    result = await db.execute(
        select(Tenant).where(
            or_(Tenant.slug == slug, Tenant.subdomain == slug, Tenant.name.ilike(slug)),
            Tenant.is_active == True,
            Tenant.is_deleted == False,
        ).limit(1)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"Tenant not found: '{slug}'")
    return {
        "tenant_id": str(tenant.id),
        "name": tenant.name,
        "slug": getattr(tenant, 'slug', slug),
        "subdomain": getattr(tenant, 'subdomain', slug),
        "is_active": tenant.is_active,
    }
