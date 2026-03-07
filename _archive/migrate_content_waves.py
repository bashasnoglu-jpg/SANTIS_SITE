import asyncio
import sys
import os
import json
import time

sys.path.append(os.getcwd())
from database import AsyncSessionLocal
from app.services.publish_engine import AtomicPublishEngine

WAVES = [
    {"name": "Wave 1", "limit": 25},
    {"name": "Wave 2", "limit": 50},
    {"name": "Wave 3", "limit": 1000} # Remaining
]

async def migrate_data():
    print("\n[Phase B4] Starting Controlled 109 Migration\n")
    
    # We will migrate `services` and `products`
    migration_items = []
    
    # 1. Load services.json
    services_path = os.path.join(os.getcwd(), "assets", "data", "services.json")
    if os.path.exists(services_path):
        with open(services_path, "r", encoding="utf-8") as fs:
            services_data = json.load(fs)
            if isinstance(services_data, list):
                for v in services_data:
                    slug = v.get("slug", v.get("id", "unknown-service"))
                    migration_items.append({
                        "slug": slug,
                        "region": "tr",
                        "locale": "tr",
                        "payload": v
                    })
                    
    # 2. Load product-data.json
    products_path = os.path.join(os.getcwd(), "assets", "data", "product-data.json")
    if os.path.exists(products_path):
        with open(products_path, "r", encoding="utf-8") as fp:
            products_data = json.load(fp)
            if isinstance(products_data, list):
                for v in products_data:
                    slug = v.get("slug", v.get("id", "unknown-product"))
                    # Prefix to prevent namespace collision with services
                    migration_items.append({
                        "slug": f"product-{slug}",
                        "region": "tr",
                        "locale": "tr",
                        "payload": v
                    })
            
    # For now, let's just make sure we hit "109" items if possible or cap it.
    total_items = len(migration_items)
    print(f"Total entries queued for migration: {total_items}\n")
    
    async with AsyncSessionLocal() as db:
        engine = AtomicPublishEngine(db)
        
        current_idx = 0
        for wave in WAVES:
            if current_idx >= total_items:
                break
                
            limit = wave["limit"]
            print(f"--- Launching {wave['name']} ({limit} records) ---")
            
            wave_items = migration_items[current_idx:current_idx+limit]
            
            t0 = time.perf_counter()
            success_count = 0
            
            for item in wave_items:
                try:
                    res = await engine.publish_content(
                        slug=item["slug"],
                        region=item["region"],
                        locale=item["locale"],
                        payload=item["payload"],
                        actor="migration_script",
                        action="migration_publish"
                    )
                    success_count += 1
                except Exception as e:
                    print(f"ERROR on {item['slug']}: {e}")
                    
            t1 = time.perf_counter()
            elapsed_ms = (t1-t0)*1000
            
            avg_ms = elapsed_ms / max(1, success_count)
            print(f"✅ {wave['name']} Complete. Migrated {success_count}/{len(wave_items)} items.")
            print(f"⏱️ Total Time: {elapsed_ms:.2f}ms | Avg per item: {avg_ms:.2f}ms")
            
            current_idx += limit
            
            if wave["name"] != "Wave 3" and current_idx < total_items:
                print("Waiting 3 seconds before next wave...")
                time.sleep(3)

    print("\n🎯 Migration Finished.")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(migrate_data())
