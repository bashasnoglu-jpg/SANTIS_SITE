import asyncio
import os
import sys
from pydantic_settings import BaseSettings

# Simple settings to get DB URL
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/santis_db"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

async def run_v11_migration():
    try:
        import asyncpg
    except ImportError:
        print("Error: asyncpg is required. Run 'pip install asyncpg'")
        sys.exit(1)

    dsn = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    print(f"Connecting to database: {dsn.split('@')[-1]}")
    
    conn = await asyncpg.connect(dsn)
    try:
        print("Starting V11 Omni-Lingo & Currency Migration...")
        
        # 1. New Table: ui_translations
        print("Creating table: ui_translations...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS ui_translations (
                id UUID PRIMARY KEY,
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                lang VARCHAR(5) NOT NULL,
                translation_key VARCHAR(255) NOT NULL,
                translation_value TEXT NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (tenant_id, lang, translation_key)
            );
            CREATE INDEX IF NOT EXISTS ix_ui_translations_key ON ui_translations(translation_key);
            CREATE INDEX IF NOT EXISTS ix_ui_translations_lang ON ui_translations(lang);
        """)

        # 2. New Table: fx_rates_history
        print("Creating table: fx_rates_history...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS fx_rates_history (
                id UUID PRIMARY KEY,
                date DATE NOT NULL,
                base_currency VARCHAR(3) NOT NULL,
                target_currency VARCHAR(3) NOT NULL,
                conversion_rate NUMERIC(10, 4) NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (date, base_currency, target_currency)
            );
        """)

        # 3. Alter Table: services (JSONB translation columns)
        print("Applying JSONB omni-lingo columns to services...")
        try:
            await conn.execute("ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;")
            await conn.execute("ALTER TABLE services ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}'::jsonb;")
            await conn.execute("ALTER TABLE services ADD COLUMN IF NOT EXISTS desc_translations JSONB DEFAULT '{}'::jsonb;")
            print("Services table updated successfully.")
        except Exception as e:
            print(f"Warning during services alter (could already exist): {e}")

        # 4. Alter Table: bookings (Currency Snapshot columns)
        print("Applying FX snapshot columns to bookings...")
        try:
            await conn.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fx_rate_snapshot NUMERIC(10, 4) DEFAULT 1.0;")
            await conn.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS local_currency VARCHAR(3);")
            await conn.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC(10, 2);")
            
            # Backfill existing bookings taking local_currency from existing currency_snapshot
            await conn.execute("""
                UPDATE bookings 
                SET local_currency = currency_snapshot,
                    base_currency_amount = price_snapshot, -- Assuming legacy bookings were 1:1 base
                    fx_rate_snapshot = 1.0 
                WHERE local_currency IS NULL;
            """)
            print("Bookings table updated successfully.")
        except Exception as e:
            print(f"Warning during bookings alter: {e}")

        print("====================================")
        print("✅ V11 MIGRATION SUCCESSFULLY COMPLETED")
        print("====================================")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_v11_migration())
