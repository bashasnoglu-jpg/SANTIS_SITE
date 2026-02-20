from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core import security
from app.core.config import settings
from app.core.permissions import Permission, ROLE_PERMISSIONS
from app.db.models import user as models
from app.schemas import auth as schemas
from app.db.session import get_db
from app.services.audit import AuditService, AuditAction, AuditStatus

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> models.User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
        
    import uuid
    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format in token")

    result = await db.execute(
        select(models.User).where(models.User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if token_data.tv is not None and user.token_version != token_data.tv:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired (Global Logout)",
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

def require_permission(permission: Permission):
    """
    Dependency factory to enforce RBAC.
    """
    async def dependency(
        current_user: models.User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> models.User:
        # 1. Superusers (Platform Admins) bypass or have all permissions
        if current_user.is_superuser or current_user.is_platform_admin:
             return current_user
             
        # 2. Check Role Mapping
        # Default to empty set if role not found
        # Use .value to ensure string key match
        role_key = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        user_permissions = ROLE_PERMISSIONS.get(role_key, set())
        
        if permission not in user_permissions:
            # 3. Log Audit Failure
            await AuditService.log(
                db=db,
                action=AuditAction.PERMISSION_DENIED,
                actor_id=current_user.id,
                tenant_id=current_user.tenant_id,
                entity_type="Security",
                entity_id=None,
                details={
                    "required_permission": permission.value,
                    "user_role": current_user.role
                },
                status=AuditStatus.FAILURE
            )
            
            # CRITICAL: Commit audit log so it persists despite the 403 exception rollback
            await db.commit()

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission.value} required"
            )
            
        return current_user
    return dependency

def enforce_tenant_scope(target_entity, current_user: models.User):
    """
    Helper to enforce tenant isolation.
    Raises 403 if target belongs to a different tenant.
    Skips check for Platform Admins/Superusers.
    """
    if current_user.is_superuser or current_user.is_platform_admin:
        return
        
    if not hasattr(target_entity, "tenant_id"):
        # If entity doesn't have tenant_id, we assume it's public or check is irrelevant, 
        # but for safety in this context, we might want to warn. 
        # For now, pass.
        return

    if str(target_entity.tenant_id) != str(current_user.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Cross-tenant access denied"
        )


async def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_active_owner(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_platform_admin and current_user.role != models.UserRole.OWNER:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges (Owner required)"
        )
    return current_user

async def get_current_active_manager(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_platform_admin and current_user.role not in [models.UserRole.OWNER, models.UserRole.MANAGER]:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges (Manager required)"
        )
    return current_user
