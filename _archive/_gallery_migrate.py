import asyncio
from app.db.session import engine
from sqlalchemy import text

async def migrate():
    cols = [
        "dominant_color TEXT DEFAULT '#1a1a1a'",
        "thumb_path TEXT DEFAULT ''",
        "card_path TEXT DEFAULT ''",
        "hero_path TEXT DEFAULT ''",
        "view_count INTEGER DEFAULT 0",
    ]
    async with engine.begin() as conn:
        for col in cols:
            col_name = col.split()[0]
            try:
                await conn.execute(text(f"ALTER TABLE gallery_assets ADD COLUMN {col}"))
                print(f"  Added: {col_name}")
            except Exception:
                print(f"  Skip (exists): {col_name}")
    print("Migration done.")

asyncio.run(migrate())
