import asyncio
import aiohttp
import sys
import random
import logging

sys.path.append('c:/Users/tourg/Desktop/SANTIS_SITE')

from app.db.session import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logging.getLogger("santis_event_bus").setLevel(logging.WARNING) # Supress success logs to keep terminal clean

NODES = ["Istanbul", "London", "Dubai", "Antalya"]

async def main():
    # Skip DB connection to avoid Windows local IPv6 asyncpg resolution errors
    # Just use a known tenant UUID from earlier queries
    tenant_id = "7e6d1259-f130-4a73-b11d-36c0e9cbe4dc"

    print("==================================================")
    print("🌩️ OPERATION SOVEREIGN STORM INITIATED 🌩️")
    print("==================================================")
    print("Waiting 3 seconds for Commander to open the CEO Dashboard...")
    for i in range(3, 0, -1):
        print(f"Storm arriving in {i}...")
        await asyncio.sleep(1)
        
    print("==================================================")
    print("🌊 STORM IS HERE. BRACE FOR IMPACT. 🌊")
    print("==================================================")

    # 1. THE GOLDEN FLOOD
    async def golden_flood(session):
        for i in range(1500):
            node = random.choice(NODES)
            payload = {
                "event_name": 'booking_created',
                "payload": {
                    "revenue_eur": round(random.uniform(500, 3500), 2),
                    "service_name": "VIP Spa Ritual",
                    "surge_multiplier": 1.0,
                    "is_vip": random.random() > 0.8,
                    "city": node,
                    "storm_id": i
                },
                "tenant_id": tenant_id
            }
            async with session.post('http://127.0.0.1:8000/api/v1/boardroom/fire-event', json=payload) as res:
                res.raise_for_status()
            await asyncio.sleep(0.005) # ~200 events per second

    # 2. THE SURGE TRIGGER
    async def surge_trigger(session):
        await asyncio.sleep(3) # Wait until the flood is underway
        for i in range(150):
            node = random.choice(NODES)
            payload = {
                "event_name": 'surge_activated',
                "payload": {
                    "action": "FLARE",
                    "revenue_eur": round(random.uniform(10000, 25000), 2),
                    "service_name": "Leviathan VIP Booking",
                    "surge_multiplier": round(random.uniform(4.0, 7.5), 2),
                    "is_vip": True,
                    "city": node,
                    "storm_id": f"SURGE-{i}"
                },
                "tenant_id": tenant_id
            }
            async with session.post('http://127.0.0.1:8000/api/v1/boardroom/fire-event', json=payload) as res:
                res.raise_for_status()
            await asyncio.sleep(0.02)

    # 3. THE SENTINEL AWAKENING
    async def sentinel_awakening(session):
        await asyncio.sleep(5) # Delay until peak chaos
        for i in range(100):
            node = random.choice(NODES)
            payload = {
                "event_name": 'fraud_blocked',
                "payload": {
                    "action": "SENTINEL_FLARE",
                    "message": "Impossible Travel Sync Blocked.",
                    "city": node,
                    "storm_id": f"FRAUD-{i}"
                },
                "tenant_id": tenant_id
            }
            async with session.post('http://127.0.0.1:8000/api/v1/boardroom/fire-event', json=payload) as res:
                res.raise_for_status()
            await asyncio.sleep(0.05)
            
    async with aiohttp.ClientSession() as session:
        await asyncio.gather(
            golden_flood(session),
            surge_trigger(session),
            sentinel_awakening(session)
        )
    
    await asyncio.sleep(5) # Let trailing events flush
    print("==================================================")
    print("🌅 SOVEREIGN STORM COMPLETED. LEVIATHAN STANDS. 🌅")
    print("==================================================")

if __name__ == "__main__":
    import traceback
    try:
        asyncio.run(main())
    except Exception as e:
        print("STORM CRASHED:")
        print(traceback.format_exc())
