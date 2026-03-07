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

async def run_v12_migration():
    try:
        import asyncpg
    except ImportError:
        print("Error: asyncpg is required. Run 'pip install asyncpg'")
        sys.exit(1)

    dsn = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    print(f"Connecting to database: {dsn.split('@')[-1]}")
    
    conn = await asyncpg.connect(dsn)
    try:
        print("Starting V12 Sovereign Event Bus Migration...")
        
        # 1. New Table: events
        print("Creating table: events...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id UUID PRIMARY KEY,
                tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
                user_id VARCHAR,
                session_id VARCHAR,
                event_name VARCHAR NOT NULL,
                metadata_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                device_fingerprint VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        """)

        # 2. Add fast analytical indexes
        print("Creating indexes on events table...")
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS ix_events_tenant_id ON events(tenant_id);
            CREATE INDEX IF NOT EXISTS ix_events_user_id ON events(user_id);
            CREATE INDEX IF NOT EXISTS ix_events_session_id ON events(session_id);
            CREATE INDEX IF NOT EXISTS ix_events_event_name ON events(event_name);
            CREATE INDEX IF NOT EXISTS ix_events_name_time ON events(event_name, created_at);
        """)

        # 3. Insert Mock Booking Created Event (Nabız Yoklaması)
        print("Inserting mock 'booking_created' event for validation...")
        try:
            # We fetch an active tenant ID for the mock
            res = await conn.fetch("SELECT id FROM tenants WHERE is_active = true LIMIT 1")
            tenant_id = res[0]["id"] if res else None
            
            import uuid
            mock_id = str(uuid.uuid4())
            import json
            
            mock_payload = json.dumps({
                "booking_value_eur": 1250.0,
                "surge_multiplier": 1.2,
                "room_type": "KING_SUITE",
                "is_vip": True
            })

            query = """
                INSERT INTO events (id, tenant_id, user_id, event_name, metadata_payload, device_fingerprint)
                VALUES ($1, $2, 'sys_mock_user', 'booking_created', $3::jsonb, 'mock_fingerprint_v1')
                ON CONFLICT (id) DO NOTHING
            """
            await conn.execute(query, mock_id, tenant_id, mock_payload)
            print("Mock 'booking_created' inserted successfully.")
            
        except Exception as e:
            print(f"Warning during mock event insertion: {e}")

        print("==================================================")
        print("✅ V12 EVENT BUS MIGRATION SUCCESSFULLY COMPLETED")
        print("==================================================")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_v12_migration())
