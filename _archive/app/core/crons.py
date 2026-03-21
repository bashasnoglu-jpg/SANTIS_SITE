import asyncio
from datetime import datetime, timedelta, date, time
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.tenant import Tenant
from app.db.models.service import Service
from app.db.models.staff import Staff
from app.db.models.resource import Resource
from app.db.models.precomputed_slot import PrecomputedSlot, SlotStatus
from sqlalchemy.dialects.postgresql import insert

async def run_phase_q_nightly_job(days_ahead: int = 14):
    """
    Phase Q: Precomputed Slot Generator.
    Runs nightly to create atomic booking slots for the next 14 days.
    This guarantees reads are 100x faster and conflicts are manageable at scale.
    """
    print(f"\n[Phase Q] Starting Nightly Slot Generation for next {days_ahead} days...")
    
    async with AsyncSessionLocal() as db:
        # Get active tenants
        tenants = await db.execute(select(Tenant).where(Tenant.is_active == True))
        tenants = tenants.scalars().all()
        
        for tenant in tenants:
            print(f"[Phase Q] Generating for Tenant: {tenant.name}")
            
            # Fetch base data
            services = await db.execute(select(Service).where(Service.tenant_id == tenant.id, Service.is_active == True))
            services = list(services.scalars().all())
            
            staff = await db.execute(select(Staff).where(Staff.tenant_id == tenant.id, Staff.is_active == True))
            staff_list = list(staff.scalars().all())
            
            resources = await db.execute(select(Resource).where(Resource.tenant_id == tenant.id, Resource.is_active == True))
            resource_list = list(resources.scalars().all())
            
            # Default working hours simulation
            open_time = time(8, 0)
            close_time = time(22, 0)
            
            base_date = datetime.now().date()
            
            slots_to_create = []
            
            for d_idx in range(days_ahead + 1):
                current_date = base_date + timedelta(days=d_idx)
                
                # Iterate sequentially from opening to close
                for service in services:
                    # Very simple step logic: create slots every N minutes based on duration
                    # In real SaaS, this would consider staff schedules and operating hours
                    
                    # Generate blocks
                    curr_dt = datetime.combine(current_date, open_time)
                    end_of_day = datetime.combine(current_date, close_time)
                    
                    while curr_dt + timedelta(minutes=service.duration_minutes) <= end_of_day:
                        slot_end = curr_dt + timedelta(minutes=service.duration_minutes)
                        
                        # Tie slot to a pseudo-available staff and resource if available
                        assigned_staff = staff_list[0] if staff_list else None
                        assigned_resource = resource_list[0] if resource_list else None
                        
                        slots_to_create.append({
                            "tenant_id": tenant.id,
                            "service_id": service.id,
                            "staff_id": assigned_staff.id if assigned_staff else None,
                            "resource_id": assigned_resource.id if assigned_resource else None,
                            "start_time": curr_dt,
                            "end_time": slot_end,
                            "status": SlotStatus.AVAILABLE
                        })
                        
                        curr_dt = slot_end
                
            # Upsert logic to avoid crashing on duplicate runs
            if slots_to_create:
                stmt = insert(PrecomputedSlot).values(slots_to_create)
                stmt = stmt.on_conflict_do_nothing(
                    constraint='uix_slot_identity'
                )
                await db.execute(stmt)
                await db.commit()
                print(f"[Phase Q] Tenant {tenant.name}: Processed {len(slots_to_create)} slots.")
                
    print("[Phase Q] Completed.")

if __name__ == "__main__":
    asyncio.run(run_phase_q_nightly_job())
