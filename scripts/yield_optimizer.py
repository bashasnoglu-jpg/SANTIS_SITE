import asyncio
import os
import sys
from datetime import date, timedelta
from dotenv import load_dotenv
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal

# Pre-load all models to resolve SQLAlchemy registry conflicts
from app.db.models import user, booking, tenant, service, staff, room, customer, commission, revenue, audit, consent

from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service
from app.db.models.tenant import Tenant

load_dotenv(override=True)

async def calculate_demand_and_adjust_prices():
    print("📉 Booting Phase 5: Cognitive Yield Engine...")
    
    async with AsyncSessionLocal() as db:
        # Determine target date for algorithm (tomorrow's schedule)
        target_date = date.today() + timedelta(days=1)
        
        # 1. Fetch Tenants
        tenants_res = await db.execute(select(Tenant))
        tenants = tenants_res.scalars().all()
        
        for tenant in tenants:
            print(f"\n--- Analyzing Yield Options for {tenant.name} ---")
            
            # Assume 10 max concurrent slots per day for demo simplicity
            MAX_DAILY_SLOTS = 10 
            
            # 2. Count Active Bookings for Tomorrow
            stmt = (
                select(func.count(Booking.id))
                .where(Booking.tenant_id == tenant.id)
                .where(func.date(Booking.start_time) == target_date)
                .where(Booking.status != BookingStatus.CANCELLED)
            )
            res = await db.execute(stmt)
            booked_slots = res.scalar() or 0
            
            utilization = (booked_slots / MAX_DAILY_SLOTS) * 100
            print(f"Projected Utilization ({target_date}): {utilization:.1f}% ({booked_slots}/{MAX_DAILY_SLOTS} Slots)")
            
            # 3. Yield Algorithm Logic
            multiplier = 1.0
            pricing_action = "MAINTAIN"
            
            if utilization > 80:
                multiplier = 1.15
                pricing_action = "SURGE (+15%)"
            elif utilization > 95:
                multiplier = 1.35
                pricing_action = "SCARCITY (+35%)"
            elif utilization < 30:
                multiplier = 1.0
                pricing_action = "FLASH_PRIVILEGE_REQUIRED"
                print("⚠️ Dead Zone Detected. Triggering Global Outreach for Lookalike Audiences.")
            
            print(f"Engine Decision: {pricing_action} -> Global Multiplier set to {multiplier}x")
            
            # 4. Apply Pricing Update to Services
            # Fetch all active services for this tenant
            services_res = await db.execute(select(Service).where(Service.tenant_id == tenant.id, Service.is_active == True))
            services = services_res.scalars().all()
            
            for service in services:
                # Initialize base constraints if not exist
                base = float(service.price)
                min_price = float(service.min_price_eur) if service.min_price_eur else base * 0.9
                max_price = float(service.max_price_eur) if service.max_price_eur else base * 1.5
                
                # Calculate new target price
                target_price = base * multiplier
                
                # Apply Quiet Luxury Guardrails
                target_price = max(min_price, min(max_price, target_price))
                
                service.min_price_eur = min_price
                service.max_price_eur = max_price
                service.current_price_eur = round(target_price, 2)
                service.demand_multiplier = multiplier
                
            await db.commit()
            print("✅ Database Ledger Updated with Dynamic Pricing.")
            
if __name__ == "__main__":
    asyncio.run(calculate_demand_and_adjust_prices())
