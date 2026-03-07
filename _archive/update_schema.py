import asyncio
from database import init_db

async def update_schema():
    print("Updating schema to include new tables...")
    await init_db()
    print("Schema updated successfully. Multi-Tenant Registry tables are live.")

if __name__ == "__main__":
    asyncio.run(update_schema())
