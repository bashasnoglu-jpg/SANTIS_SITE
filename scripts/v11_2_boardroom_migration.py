import asyncio
import os
import sys
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/santis_db"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

async def run_v11_2_migration():
    try:
        import asyncpg
    except ImportError:
        print("Error: asyncpg is required. Run 'pip install asyncpg'")
        sys.exit(1)

    dsn = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    print(f"Connecting to database: {dsn.split('@')[-1]}")
    
    conn = await asyncpg.connect(dsn)
    try:
        print("Starting V11.2 The Boardroom Migration...")
        
        # 1. New Table: chains
        print("Creating table: chains...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS chains (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                base_currency VARCHAR(3) DEFAULT 'EUR',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP WITHOUT TIME ZONE
            );
        """)

        # 2. Alter Table: tenants (add chain_id)
        print("Applying chain_id to tenants...")
        try:
            await conn.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS chain_id UUID REFERENCES chains(id) ON DELETE SET NULL;")
            print("Tenants table updated successfully.")
        except Exception as e:
            print(f"Warning during tenants alter: {e}")

        # 3. Data Seed: Create default Global Chain and link existing tenants
        print("Seeding Global Chain and linking existing tenants...")
        # Upsert the Sovereign chain
        await conn.execute("""
            INSERT INTO chains (id, name, base_currency) 
            VALUES ('c0000000-0000-0000-0000-000000000000', 'Sovereign Resorts Global', 'EUR')
            ON CONFLICT (name) DO NOTHING;
        """)
        
        # Get the ID of the chain
        chain_id = await conn.fetchval("SELECT id FROM chains WHERE name = 'Sovereign Resorts Global'")
        if chain_id:
            await conn.execute("""
                UPDATE tenants SET chain_id = $1 WHERE chain_id IS NULL;
            """, chain_id)
            print("Successfully linked homeless tenants to Sovereign Resorts Global.")

        print("====================================")
        print("✅ V11.2 MIGRATION SUCCESSFULLY COMPLETED")
        print("====================================")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_v11_2_migration())
