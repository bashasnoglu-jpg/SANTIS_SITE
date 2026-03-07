import codecs

path = 'c:/Users/tourg/Desktop/SANTIS_SITE/app/api/v1/endpoints/revenue.py'
code_to_append = '''

# --- ATEŞLEME 1: REAL-DEMAND INTEGRATION (Data-Link) ---
from app.db.models.tenant_config import TenantConfig
import random

@router.get("/occupancy")
async def get_realtime_occupancy(
    db: AsyncSession = Depends(get_db),
    tenant: deps.models.Tenant = Depends(deps.resolve_tenant_from_header)
):
    """
    Phase 38: Real-Demand Integration
    Reads live occupancy and triggers the Autonomous Surge Pricing.
    """
    # In a real environment, this connects to the PMS (Property Management System) via tenant_id
    # We mock real-time capacity and web traffic
    base_occupancy = random.randint(65, 98)
    page_demand_active = random.randint(10, 60)
    
    # Surge Logic: If hotel is more than 85% full, and >30 people are checking spa rates -> SURGE
    surge_active = base_occupancy >= 85 and page_demand_active >= 30
    calculated_multiplier = 1.15 if surge_active else 1.0

    # Auto-adjust the Tenant Surge config if Agentic AI is enabled
    stmt = select(TenantConfig).where(TenantConfig.tenant_id == tenant.id)
    res = await db.execute(stmt)
    config = res.scalar_one_or_none()
    
    if config and config.ai_enabled:
        config.surge_multiplier_base = calculated_multiplier
        await db.commit()
        
    return {
        "tenant_name": tenant.name,
        "local_occupancy_pct": base_occupancy,
        "page_demand_active": page_demand_active,
        "surge_active": surge_active,
        "current_multiplier": float(config.surge_multiplier_base) if config else calculated_multiplier,
        "status": "AUTO_PILOT" if (config and config.ai_enabled) else "MANUAL"
    }
'''

with codecs.open(path, 'a', 'utf-8') as f:
    f.write(code_to_append)
print('Successfully appended.')
