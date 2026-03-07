
import asyncio
import sys
import os

# Ensure app is in python path
sys.path.append(os.getcwd())

from app.db.session import engine
from app.db.base import Base

# Import all models so Base.metadata has them
from app.db.models import user, booking, tenant, service, staff, room, customer, commission, revenue

# Import the seeding logic
from reset_admin import reset_admin

async def rebuild_db():
    print("WARNING: This will drop all tables in the configured database.")
    print(f"Database URL: {engine.url}")
    
    # Confirm removing existing sqlite file if it exists and is sqlite
    if "sqlite" in str(engine.url):
        db_path = "santis.db"
        if os.path.exists(db_path):
            print(f"Removing existing {db_path}...")
            try:
                os.remove(db_path)
            except Exception as e:
                print(f"Could not remove file (might be locked): {e}")

    print(" Creating tables...")
    async with engine.begin() as conn:
        # Just in case drop_all is needed if file wasn't removed
        # await conn.run_sync(Base.metadata.drop_all) 
        await conn.run_sync(Base.metadata.create_all)
    
    print("Tables created.")
    
    print("Seeding admin user...")
    await reset_admin()
    
    print("Done! Database is fresh and ready.")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(rebuild_db())
