import asyncio
import sys
import os
import logging
sys.path.append(os.getcwd())
from app.db.session import AsyncSessionLocal
from app.db.models.service import Service
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

async def run():
    async with AsyncSessionLocal() as db:
        print("Executing Query...")
        query = select(Service.demand_multiplier).limit(1)
        print(query)
        await db.execute(query)

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
