import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import Base
from app.db.session import engine
# Import all models to ensure they are registered
from app.db.models import user, tenant, service, booking, customer, staff, room, audit, commission, content, auth

async def init_models():
    async with engine.begin() as conn:
        # Create all tables (this is safe if they already exist, it won't drop)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables ensured.")

if __name__ == "__main__":
    asyncio.run(init_models())
