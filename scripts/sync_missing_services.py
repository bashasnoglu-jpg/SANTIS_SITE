import asyncio
import sys
import uuid
import os
import json

# Ensure the app context is available
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def insert_services():
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("SELECT id FROM tenants LIMIT 1"))
        tenant_row = res.fetchone()
        if not tenant_row:
            print("No tenant found!")
            return
            
        tenant_id = tenant_row[0] 
        # If SQLite returns bytes for UUID, decode it. Otherwise use as is.
        if isinstance(tenant_id, bytes):
            tenant_id = uuid.UUID(bytes=tenant_id).hex
        else:
            tenant_id = str(tenant_id).replace("-", "")
            
        print(f"Using Tenant ID: {tenant_id}")
        
        services_to_add = [
            {
                "id": uuid.uuid4().hex,
                "name": "Bali Aroma Masajı",
                "duration": 60,
                "price": 60.0,
                "cat": "massage",
                "name_tr": "Bali Aroma Masajı",
                "name_en": "Balinese Aroma Massage",
                "desc_tr": "Bali geleneksel dokunuşlarının, ısınmış aromatik yağlarla buluştuğu derinlemesine rahatlatıcı terapi.",
                "desc_en": "A deeply relaxing therapy combining traditional Balinese touches with warmed aromatic oils."
            },
            {
                "id": uuid.uuid4().hex,
                "name": "Bali Ayak Masajı",
                "duration": 30,
                "price": 30.0,
                "cat": "massage",
                "name_tr": "Bali Ayak Masajı",
                "name_en": "Balinese Foot Massage",
                "desc_tr": "Ayaklardaki yorgunluğu ve gerginliği alan, özel Bali teknikleriyle uygulanan lokal rahatlama masajı.",
                "desc_en": "A local relaxation massage applied with special Balinese techniques to relieve fatigue and tension in the feet."
            },
            {
                "id": uuid.uuid4().hex,
                "name": "Thai Aroma Masajı",
                "duration": 60,
                "price": 70.0,
                "cat": "massage",
                "name_tr": "Thai Aroma Masajı",
                "name_en": "Thai Aroma Massage",
                "desc_tr": "Geleneksel Thai esnetme hareketlerinin aromatik yağların rahatlatıcı etkisiyle harmanlandığı özel terapi.",
                "desc_en": "A special therapy blending traditional Thai stretching movements with the relaxing effect of aromatic oils."
            },
            {
                "id": uuid.uuid4().hex,
                "name": "Thai Ayak Masajı",
                "duration": 30,
                "price": 35.0,
                "cat": "massage",
                "name_tr": "Thai Ayak Masajı",
                "name_en": "Thai Foot Reflexology",
                "desc_tr": "Thai ahşap çubuklarıyla ayak tabanındaki refleks noktalarına uygulanan canlandırıcı ve dengeleyici ayak masajı.",
                "desc_en": "A revitalizing and balancing foot massage applied to reflex points on the soles with Thai wooden sticks."
            }
        ]
        
        for s in services_to_add:
            # Check if it exists
            res = await session.execute(text("SELECT id FROM services WHERE name = :name"), {"name": s["name"]})
            if res.fetchone():
                print(f"Service '{s['name']}' already exists, skipping.")
                continue
                
            print(f"Inserting '{s['name']}'...")
            
            name_t_json = json.dumps({"tr": s["name_tr"], "en": s["name_en"]})
            desc_t_json = json.dumps({"tr": s["desc_tr"], "en": s["desc_en"]})
            
            insert_sql = """
                INSERT INTO services (
                    id, tenant_id, name, description, duration_minutes, 
                    price, currency, current_price_eur, demand_multiplier, 
                    is_active, category, name_translations, desc_translations, created_at, is_deleted
                )
                VALUES (
                    :id, :tid, :name, :desc, :dur, 
                    :price, 'EUR', :price, 1.0, 
                    1, :cat, :name_t, :desc_t, CURRENT_TIMESTAMP, 0
                )
            """
            await session.execute(text(insert_sql), {
                "id": s["id"],
                "tid": tenant_id,
                "name": s["name"],
                "desc": s["desc_tr"],
                "dur": s["duration"],
                "price": s["price"],
                "cat": s["cat"],
                "name_t": name_t_json,
                "desc_t": desc_t_json
            })
            
        await session.commit()
        print("Done. Missing services injected into SQLite database.")

if __name__ == "__main__":
    asyncio.run(insert_services())
