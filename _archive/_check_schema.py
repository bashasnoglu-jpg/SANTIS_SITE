import asyncio, asyncpg, os
from dotenv import load_dotenv
load_dotenv()

async def main():
    dsn = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(dsn)
    cols = await conn.fetch(
        "SELECT column_name, data_type FROM information_schema.columns "
        "WHERE table_name='services' ORDER BY ordinal_position"
    )
    print("=== services TABLE COLUMNS ===")
    for c in cols:
        print(f"  {c['column_name']:30s} {c['data_type']}")
    row = await conn.fetchrow("SELECT COUNT(*) FROM services")
    print(f"\nTotal rows: {row[0]}")
    sample = await conn.fetch("SELECT * FROM services LIMIT 1")
    if sample:
        print("\nSample row keys:", list(sample[0].keys()))
    await conn.close()

asyncio.run(main())
