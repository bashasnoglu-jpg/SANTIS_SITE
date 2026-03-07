import sys
import json
import asyncio
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from app.db.session import AsyncSessionLocal
from app.db.models.gallery import GalleryAsset
from sqlalchemy import select

async def sync_vault():
    vault_path = BASE_DIR / "omni_asset_vault.json"
    if not vault_path.exists():
        print("Vault not found!")
        return
        
    with open(vault_path, "r", encoding="utf-8") as f:
        assets = json.load(f)
        
    print(f"Loaded {len(assets)} assets from vault.")
    
    async with AsyncSessionLocal() as db:
        new_count = 0
        update_count = 0
        
        # Get active tenant UUID for safety
        from app.db.models.tenant import Tenant
        tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        active_tenant = tenant_res.scalar_one_or_none()
        default_tenant_id = getattr(active_tenant.id, "hex", str(active_tenant.id)) if active_tenant else None
        
        # Get existing assets
        result = await db.execute(select(GalleryAsset))
        existing_assets = {a.id: a for a in result.scalars().all()}
        # map by filepath as well to avoid duplicates
        existing_by_path = {a.filepath: a for a in existing_assets.values()}
        
        for item in assets:
            asset_id = item["asset_id"]
            filepath = item["url"]
            if filepath.startswith('/'):
                filepath = filepath[1:] # clean leading slash
            
            existing = existing_assets.get(asset_id) or existing_by_path.get(filepath)
            
            # Sovereign Route fallback logic (Phase 8.6)
            # The UI expects standard categories for the filter:
            # "Hamam / Thermal" becomes "Hammam" etc based on UI.
            # asset_crawler mapped them to 'Hammam', 'Massage', 'Skincare', 'VIP Lounge', 'Detox', 'Revenue', 'General'.
            
            if existing: # Update
                existing.filename = item["filename"]
                existing.category = item["category"]
                if not existing.slot and item.get("target_slot"):
                    existing.slot = item["target_slot"]
                existing.is_published = True
                update_count += 1
            else: # Insert
                new_asset = GalleryAsset(
                    id=asset_id,
                    tenant_id=default_tenant_id,
                    filename=item["filename"],
                    filepath=filepath,
                    category=item["category"],
                    slot=item.get("target_slot"),
                    is_published=True,
                    is_global=True,
                    alt_text=item.get("metadata", {}).get("alt", "")
                )
                db.add(new_asset)
                new_count += 1
                
        await db.commit()
        print(f"Sync complete. {new_count} inserted, {update_count} updated.")

if __name__ == "__main__":
    asyncio.run(sync_vault())
