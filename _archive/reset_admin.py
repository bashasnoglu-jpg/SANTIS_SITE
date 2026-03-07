
import asyncio
import sys
import os

# Ensure app is in python path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.core.security import get_password_hash
from app.db.models.user import User, UserRole
# Import all models to ensure registry is populated
from app.db.models.tenant import Tenant 
from sqlalchemy.future import select

async def reset_admin():
    async with AsyncSessionLocal() as db:
        print("Checking for admin user (admin@santis.com)...")
        result = await db.execute(select(User).where(User.email == "admin@santis.com"))
        user = result.scalars().first()

        new_password = "santis_admin"
        hashed_pwd = get_password_hash(new_password)

        if user:
            print(f"User found: {user.email}. Updating password...")
            user.hashed_password = hashed_pwd
            user.role = UserRole.OWNER
            user.is_active = True
            user.is_platform_admin = True
        else:
            print("Admin user not found. Creating new one...")
            user = User(
                email="admin@santis.com",
                hashed_password=hashed_pwd,
                role=UserRole.OWNER,
                is_active=True,
                is_platform_admin=True,
                is_superuser=True
            )
            db.add(user)
        
        await db.commit()
        print(f"✅ Admin user ready.")
        print(f"Email: admin@santis.com")
        print(f"Password: {new_password}")

if __name__ == "__main__":
    asyncio.run(reset_admin())
