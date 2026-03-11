import sys
import asyncio
sys.path.append('c:/Users/tourg/Desktop/SANTIS_SITE')

from app.db.session import SessionLocal
from sqlalchemy import text

async def find_and_delete():
    async with SessionLocal() as db:
        try:
            res = await db.execute(text("SELECT id, image_url, title FROM galleries WHERE image_url LIKE '%a28e75ff%'"))
            rows = res.fetchall()
            print('GALLERIES:', rows)
            
            if rows:
                print('Deleting rows...')
                await db.execute(text("DELETE FROM galleries WHERE image_url LIKE '%a28e75ff%'"))
                await db.commit()
                print('Deleted.')
        except Exception as e:
            print('DB ERROR:', e)

if __name__ == '__main__':
    asyncio.run(find_and_delete())
