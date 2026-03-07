import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

async def fix_categories():
    engine = create_async_engine('postgresql+asyncpg://santis:santis1234@localhost:5432/santisdb', echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        res = await session.execute(text("SELECT id, name, category_id, name_translations FROM services WHERE category_id = 'faceSothys' OR category_id IS NULL OR name_translations::text ILIKE '%peeling%'"))
        rows = res.fetchall()
        print(f"Found {len(rows)} matching services")
        for r in rows:
            print(f"ID: {r.id}, Name: {r.name}, Cat: {r.category_id}, Trans: {r.name_translations}")
            print(r)
            
if __name__ == "__main__":
    asyncio.run(fix_categories())
