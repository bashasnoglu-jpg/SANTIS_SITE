"""
seed_services_from_json.py  v2
==============================
services.json → PostgreSQL santisdb.services
Schema: id, tenant_id, name, duration_minutes, price, currency,
        is_active, is_deleted, current_price_eur, min_price_eur,
        max_price_eur, demand_multiplier
"""
import json, uuid, asyncio
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

SERVICES_JSON = Path("assets/data/services.json")

# Duration hints from categoryId
DURATION_MAP = {
    "ritual-hammam":      60,
    "journey":            90,
    "massage-premium":    90,
    "massage-relaxation": 60,
    "massage-regional":   50,
    "massage-asian":      60,
    "massage-sports":     60,
    "massage-medical":    45,
    "massage-kids":       30,
    "massage-couples":    60,
    "skincare-advanced":  90,
    "skincare-ritual":    75,
    "sothys-antiage":     75,
}

# Base price hints from categoryId
PRICE_MAP = {
    "ritual-hammam":      150.0,
    "journey":            350.0,
    "massage-premium":    220.0,
    "massage-relaxation": 120.0,
    "massage-regional":   100.0,
    "massage-asian":      130.0,
    "massage-sports":     110.0,
    "massage-medical":    120.0,
    "massage-kids":        60.0,
    "massage-couples":    180.0,
    "skincare-advanced":  250.0,
    "skincare-ritual":    220.0,
    "sothys-antiage":     200.0,
}

async def main():
    import asyncpg

    dsn = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")
    print(f"🔌 Connecting: {dsn[:55]}...")
    # RLS bypass: postgres superuser ile bağlan
    # Prod'da santis user + SET app.tenant_id kullan
    pg_dsn = "postgresql://postgres@localhost:5432/santisdb"
    try:
        conn = await asyncpg.connect(pg_dsn)
        print("🔑 Connected as postgres (superuser, RLS bypassed)")
    except Exception:
        conn = await asyncpg.connect(dsn)
        print("🔐 Connected as santis user (RLS active)")
        # Set tenant context for RLS
        await conn.execute(f"SET LOCAL app.current_tenant_id = '{tenant_id}'")

    # Aktif tenant ID
    tenant_row = await conn.fetchrow(
        "SELECT id FROM tenants WHERE is_active = true LIMIT 1"
    )
    if not tenant_row:
        print("❌ Aktif tenant bulunamadı. Çıkılıyor.")
        await conn.close()
        return
    tenant_id = tenant_row["id"]  # UUID object
    print(f"🏛️ Tenant: {tenant_id}")

    # services.json yükle
    with open(SERVICES_JSON, encoding="utf-8-sig") as f:
        services = json.load(f)
    print(f"📦 JSON: {len(services)} servis")

    # Mevcut sayı
    cur_count = await conn.fetchval(
        "SELECT COUNT(*) FROM services WHERE tenant_id = $1", tenant_id
    )
    print(f"🗄️  DB mevcut: {cur_count} servis")

    inserted = 0

    for svc in services:
        name     = svc.get("title", svc.get("slug", "Unnamed"))
        cat_id   = svc.get("category", "wellness")
        duration = DURATION_MAP.get(cat_id, 60)
        price    = PRICE_MAP.get(cat_id, 120.0)

        svc_id = uuid.uuid4()
        try:
            await conn.execute("""
                INSERT INTO services
                    (id, tenant_id, name, duration_minutes, price,
                     current_price_eur, min_price_eur, max_price_eur,
                     demand_multiplier, currency, is_active, is_deleted,
                     created_at)
                VALUES
                    ($1, $2, $3, $4, $5,
                     $5, $6, $7,
                     1.0, 'EUR', true, false,
                     NOW())
            """,
                svc_id, tenant_id, name, duration, price,
                round(price * 0.8, 2), round(price * 1.5, 2)
            )
            inserted += 1
        except Exception as e:
            print(f"  ⚠️ SKIP {name[:40]}: {e}")

    await conn.close()

    print(f"\n✅ Seed tamamlandı!")
    print(f"   ➕ Eklendi:    {inserted}")
    print(f"   📊 Yeni toplam: {cur_count + inserted}")

if __name__ == "__main__":
    asyncio.run(main())
