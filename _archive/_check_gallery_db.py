import asyncio, asyncpg, os
from dotenv import load_dotenv
load_dotenv()

async def main():
    dsn = "postgresql://postgres@localhost:5432/santisdb"
    conn = await asyncpg.connect(dsn)
    rows = await conn.fetch(
        "SELECT id, filename, filepath, cdn_url, is_published FROM gallery_assets ORDER BY uploaded_at DESC LIMIT 20"
    )
    print(f"=== gallery_assets (son 20) ===")
    for r in rows:
        print(f"  fn={r['filename'][:35]:35s} | fp={str(r['filepath'])[:50]:50s} | pub={r['is_published']}")
    total = await conn.fetchval("SELECT COUNT(*) FROM gallery_assets")
    print(f"\nToplam: {total}")
    await conn.close()

asyncio.run(main())
