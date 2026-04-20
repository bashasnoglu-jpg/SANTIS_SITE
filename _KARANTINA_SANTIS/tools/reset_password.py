import asyncio
import sys
import os
from sqlalchemy import select

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.core import security
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.booking import Booking
from app.db.models.customer import Customer
from app.db.models.service import Service
from app.db.models.staff import Staff
from app.db.models.room import Room

async def reset_password():
    print("Connecting to database...")
    async with AsyncSessionLocal() as db:
        print("Searching for user admin@santis.com...")
        result = await db.execute(select(User).where(User.email == "admin@santis.com"))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User found: {user.email}")
            new_password = "admin123"
            user.hashed_password = security.get_password_hash(new_password)
            db.add(user)
            await db.commit()
            print(f"Password reset to '{new_password}' successfully.")
        else:
            print("User admin@santis.com NOT found.")
            # Create user if not exists? Maybe better not to complicate.
            # But let's check just in case.

if __name__ == "__main__":
    # Load .env variables implicitly via app.core.config usually
    # But just in case, we might need manual load if config doesn't do it.
    # Assuming config does it.
    asyncio.run(reset_password())
