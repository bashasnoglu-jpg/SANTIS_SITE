import logging
import uuid
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

logger = logging.getLogger("santis_pricing")

class PricingSafetyHook:
    """
    Component 3: Revenue Engine Safety Hooks (Antifragile Core).
    This validator enforces absolute financial limits on autonomous AI pricing algorithms.
    """
    
    @classmethod
    async def validate_and_commit_surge(cls, tenant_id: str, base_price: float, calculated_multiplier: float, correlation_id: str) -> float:
        """
        Validates the calculated AI surge against the Sovereign CTO ceiling.
        If it exceeds the cap, logs a Severe Anomaly and rolls back to Base Price (1.0x).
        Always logs the final decision into the `surge_history` audit table.
        """
        # Default failsafe limits if tenant config is unattainable
        max_cap = 2.0  
        min_cap = 0.5
        
        async with AsyncSessionLocal() as db:
            # 1. Fetch Tenant Surge Config
            try:
                res = await db.execute(text("SELECT max_cap_multiplier, min_cap_multiplier FROM surge_configs WHERE tenant_id = :tid"), {"tid": tenant_id})
                config = res.fetchone()
                if config:
                    max_cap = config[0]
                    min_cap = config[1]
            except Exception:
                pass # Graceful degradation if 'surge_configs' table hasn't migrated yet
                
            # 2. Perform Antifragile Safety Check
            final_multiplier = calculated_multiplier
            reason = "ALGORITHMIC_SURGE"
            
            if calculated_multiplier > max_cap:
                logger.error(f"[SEVERE ANOMALY] CID: {correlation_id} | Algorithm requested Surge {calculated_multiplier}x. Exceeds Max Cap {max_cap}x. Rolling back to 1.0x.")
                final_multiplier = 1.0
                reason = "SAFETY_HOOK_ROLLBACK_OVER_CAP"
                
            elif calculated_multiplier < min_cap:
                logger.error(f"[SEVERE ANOMALY] CID: {correlation_id} | Algorithm requested Surge {calculated_multiplier}x. Breaks Min Cap {min_cap}x. Rolling back to 1.0x.")
                final_multiplier = 1.0
                reason = "SAFETY_HOOK_ROLLBACK_UNDER_CAP"

            new_price = round(base_price * final_multiplier, 2)
            
            # 3. Log Audit Trail to surge_history table (DNA Propagation)
            try:
                await db.execute(text("""
                    INSERT INTO surge_history (id, tenant_id, correlation_id, old_price, new_price, multiplier, reason, created_at)
                    VALUES (:id, :target, :cid, :old, :new, :mult, :reason, CURRENT_TIMESTAMP)
                """), {
                    "id": str(uuid.uuid4()),
                    "target": tenant_id,
                    "cid": correlation_id,
                    "old": base_price,
                    "new": new_price,
                    "mult": final_multiplier,
                    "reason": reason
                })
                await db.commit()
            except Exception as e:
                logger.error(f"[Pricing Audit] Failed to record shadow log in surge_history: {e}")
                
            return final_multiplier
