import asyncio
import sys
import os
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import datetime

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.db.models.booking import Booking
from app.db.models.customer import Customer
from app.db.models.service import Service
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.staff import Staff
from app.db.models.room import Room
from app.db.models.commission import StaffCommission

async def inspect():
    async with AsyncSessionLocal() as db:
        print("Inspecting all bookings...")
        stmt = select(Booking).options(
            selectinload(Booking.service),
            selectinload(Booking.customer)
        )
        result = await db.execute(stmt)
        bookings = result.scalars().all()
        
        print(f"Found {len(bookings)} bookings.")
        for b in bookings:
            try:
                print(f"Booking {b.id}:")
                print(f"  - Tenant: {b.tenant_id}")
                print(f"  - Start: {b.start_time}")
                print(f"  - Service: {b.service.name if b.service else 'None'} (ID: {b.service_id})")
                print(f"  - Customer: {b.customer.full_name if b.customer else 'None'} (ID: {b.customer_id})")
                print(f"  - Status: {b.status}")
            except Exception as e:
                print(f"  !!! ERROR inspecting booking {b.id}: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
