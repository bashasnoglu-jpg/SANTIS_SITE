from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, List

from app.api import deps
from app.schemas import auth as schemas
from app.db.session import get_db
from app.db.models.user import User
from app.services.audit import AuditService, AuditAction, AuditStatus

from app.core.permissions import Permission

router = APIRouter()

@router.get("/me", response_model=schemas.UserOut)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    if current_user.is_deleted:
         raise HTTPException(status_code=404, detail="User not found")
    return current_user

from app.core.tenant_scope import scoped_query

@router.get("/", response_model=List[schemas.UserOut])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.require_permission(Permission.USER_READ)),
) -> Any:
    """
    Retrieve users. 
    - Superusers: All users.
    - Tenant Admins: Only users in their tenant.
    - Soft-deleted users are automatically filtered out.
    """
    query = scoped_query(User, current_user).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    return users

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.require_permission(Permission.USER_DELETE)),
) -> Any:
    """
    Soft delete a user.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    if user.is_deleted:
        raise HTTPException(status_code=409, detail="User already deleted")

    # Tenant Guard
    deps.enforce_tenant_scope(user, current_user)

    # Soft Delete Logic
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    user.deleted_by = current_user.id
    
    # Audit Log
    await AuditService.log(
        db=db,
        action=AuditAction.DELETE,
        actor_id=current_user.id,
        tenant_id=current_user.tenant_id,
        entity_type="User",
        entity_id=user.id,
        details={"soft_delete": True, "email": user.email},
        status=AuditStatus.SUCCESS
    )

    await db.commit()
    return {"status": "success", "message": "User soft deleted"}
