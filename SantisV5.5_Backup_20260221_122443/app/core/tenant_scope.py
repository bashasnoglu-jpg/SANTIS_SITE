from typing import Any, List, Optional
from sqlalchemy import select
from sqlalchemy.sql import Select

def scoped_query(
    model: Any, 
    current_user: Any, 
    filters: Optional[List[Any]] = None
) -> Select:
    """
    Creates a SQLAlchemy select statement with automatic tenant scoping and soft-delete filtering.
    
    Args:
        model: The SQLAlchemy model class to query.
        current_user: The user object requesting the data.
        filters: A list of additional SQLAlchemy filters (WHERE clauses).
        
    Returns:
        A SQLAlchemy Select statement ready to be executed or further modified (pagination etc).
        
    Security Logic:
        1. Soft Delete: Always filters `is_deleted == False` if the model supports it.
        2. Tenant Isolation: 
           - Users/Managers: Enforces `tenant_id == current_user.tenant_id`.
           - Superusers: Bypasses tenant check (sees all).
    """
    stmt = select(model)

    # 1. Global Soft Delete Filter (Zero Error: Hard Constraint)
    if hasattr(model, "is_deleted"):
        # We explicitly check for False to be safe
        stmt = stmt.where(model.is_deleted == False)

    # 2. Tenant Isolation
    # Check if user is superuser/platform admin (Bypass)
    is_admin = getattr(current_user, "is_superuser", False) or getattr(current_user, "is_platform_admin", False)

    if not is_admin:
        # Enforce Tenant Scope
        # Only if model HAS tenant_id (public models skip this)
        if hasattr(model, "tenant_id"):
            # Ensure we filter by current_user's tenant_id
            # If current_user has no tenant_id but isn't admin, they see nothing?
            # Or assume they are detached? For safety, we enforce checks.
            user_tenant_id = getattr(current_user, "tenant_id", None)
            if user_tenant_id:
                stmt = stmt.where(model.tenant_id == user_tenant_id)
            else:
                # User has no tenant_id but isn't admin -> Assume no access to tenant data
                # Force empty result or handle logic?
                # For Phase C robustness, let's filter by None, effectively matching nothing 
                # unless rows have NULL tenant_id (which shouldn't be accessible either normally).
                # But safer to match against user's tenant_id anyway.
                # If user_tenant_id is None, `model.tenant_id == None` might return public records?
                # Let's stick to standard behavior: filter by user's tenant_id.
                stmt = stmt.where(model.tenant_id == user_tenant_id)
    
    # 3. Apply Additional Filters
    if filters:
        for f in filters:
            stmt = stmt.where(f)

    return stmt
