import asyncio
import sys
import os
sys.path.append(os.getcwd())
from app.db.session import AsyncSessionLocal
from app.db.models.service import Service
from sqlalchemy import update

async def trigger_john_wick_surge():
    async with AsyncSessionLocal() as db:
        print("🚨 JOHN WICK DETECTED 🚨")
        print("Initiating Cognitive Yield Surge (+20% Demand Multiplier)...")
        await db.execute(update(Service).values(demand_multiplier=1.20))
        await db.commit()
        print("Surge engaged. Prices adjusted dynamically across the board.")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(trigger_john_wick_surge())
