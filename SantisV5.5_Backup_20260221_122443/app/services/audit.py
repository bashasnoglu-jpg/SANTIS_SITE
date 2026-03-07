import logging
import traceback
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.audit import AuditLog, AuditAction, AuditStatus

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        action: AuditAction,
        actor_id: Optional[Any] = None,
        tenant_id: Optional[Any] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[Any] = None,
        details: Optional[dict] = None,
        status: AuditStatus = AuditStatus.SUCCESS
    ) -> bool:
        """
        Logs an activity to the database.
        
        CRITICAL: This method does NOT commit. It only adds the object to the session.
        The main transaction commits it. 
        Exceptions are caught to prevent blocking the main flow.
        """
        try:
            # Safe enum conversion to string
            action_str = action.value if hasattr(action, 'value') else str(action)
            status_str = status.value if hasattr(status, 'value') else str(status)

            audit_entry = AuditLog(
                action=action_str,
                actor_id=actor_id,
                tenant_id=tenant_id,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details,
                status=status_str
            )
            
            db.add(audit_entry)
            return True

        except Exception as e:
            # FAIL-SAFE: Don't break the app if logging fails
            logger.warning(f"Audit log failed: {e}")
            # Optional: trace for debugging
            # traceback.print_exc()
            return False
