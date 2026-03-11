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
            await conn.execute(text("ALTER TABLE services ADD COLUMN category VARCHAR(100);"))
            print("Successfully added category to services table.")
        except Exception as e:
            if 'already exists' in str(e):
                print("Column category already exists.")
            else:
                print(f"Error adding category: {e}")

        try:
            await conn.execute(text(\"\"\"
                CREATE TABLE IF NOT EXISTS service_inventory (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
                    item_name VARCHAR(255) NOT NULL,
                    unit VARCHAR(50),
                    current_stock INTEGER NOT NULL DEFAULT 0,
                    min_threshold INTEGER NOT NULL DEFAULT 5,
                    is_luxury BOOLEAN DEFAULT FALSE,
                    notes TEXT,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            \"\"\"))
            print("Successfully created service_inventory table.")
        except Exception as e:
            print(f"Error creating table: {e}")

asyncio.run(alter_db())
