import asyncio
from app.db.session import engine
from app.db.base import Base

# We import the models so that Base.metadata.create_all picks them up
from app.db.models.crm import GuestTrace, IntentSummary

async def recreate():
    print("Recreating Phase 5 CRM Tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Done.")

if __name__ == "__main__":
    asyncio.run(recreate())
