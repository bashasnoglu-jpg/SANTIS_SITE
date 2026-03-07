import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def clean():
    async with AsyncSessionLocal() as db:
        await db.execute(text("DELETE FROM gallery_assets WHERE filename LIKE '%9b461af6ccba4858bc50a0d6174429e3%'"))
        await db.commit()
        print('Cleaned')

if __name__ == "__main__":
    asyncio.run(clean())
