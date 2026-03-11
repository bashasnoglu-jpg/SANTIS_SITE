import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DB_URL)

async def alter_db():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE bookings ADD COLUMN payment_intent_id VARCHAR(255);"))
            print("Successfully added payment_intent_id to bookings table.")
        except Exception as e:
            if 'already exists' in str(e):
                print("Column already exists.")
            else:
                print(f"Error: {e}")

asyncio.run(alter_db())
