import asyncio
import sys
import os
from sqlalchemy import select
import uuid

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.db.models.user import User
# Import all to be safe
from app.db.models.tenant import Tenant
from app.db.models.booking import Booking
from app.db.models.customer import Customer
from app.db.models.service import Service
from app.db.models.staff import Staff
from app.db.models.room import Room
from app.db.models.commission import StaffCommission


async def fix_admin():
    async with AsyncSessionLocal() as db:
        user_id_str = "5e4dc1de-2bbf-47ec-b556-89c6b3a3e175"
        target_tenant_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        
        print(f"Fixing user {user_id_str}...")
        
        stmt = select(User).where(User.id == uuid.UUID(user_id_str))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User Found: {user.email}")
            print(f"Old Tenant ID: {user.tenant_id}")
            
            user.tenant_id = target_tenant_id
            db.add(user)
            await db.commit()
            
            print(f"New Tenant ID: {user.tenant_id}")
            print("Successfully updated.")
        else:
            print("User NOT found.")
            
if __name__ == "__main__":
    asyncio.run(fix_admin())
