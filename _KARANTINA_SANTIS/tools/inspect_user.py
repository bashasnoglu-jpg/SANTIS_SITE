import asyncio
import sys
import os
from sqlalchemy import select
import uuid

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.db.models.user import User
from app.db.models.tenant import Tenant

async def inspect():
    async with AsyncSessionLocal() as db:
        user_id_str = "5e4dc1de-2bbf-47ec-b556-89c6b3a3e175"
        print(f"Inspecting user {user_id_str}...")
        
        try:
            uid = uuid.UUID(user_id_str)
            stmt = select(User).where(User.id == uid)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user:
                print(f"User Found: {user.email}")
                print(f"Tenant ID: {user.tenant_id}")
                print(f"Role: {user.role}")
                print(f"Is Superuser: {user.is_superuser}")
            else:
                print("User NOT found in this DB.")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
