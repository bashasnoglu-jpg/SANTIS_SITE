import asyncio, asyncpg
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

async def main():
    conn = await asyncpg.connect("postgresql://postgres@localhost:5432/santisdb")
    rows = await conn.fetch(
        "SELECT filename, filepath, is_published FROM gallery_assets ORDER BY uploaded_at DESC"
    )
    print(f"=== gallery_assets: {len(rows)} kayit ===")
    for r in rows:
        fn = r["filename"][:40] if r["filename"] else "?"
        fp = str(r["filepath"])[:55] if r["filepath"] else "?"
        exists = "OK" if Path(fp.lstrip("/")).exists() else "MISSING"
        print(f"  {exists}  {fn:40s} | {fp}")
    await conn.close()

asyncio.run(main())
