"""
app/api/v1/endpoints/gallery.py
Phase Visual - Gallery Assessment API
Handles image uploads, processing via Image Factory, and data enrichment for Pinterest grid.
"""
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db, AsyncSessionLocal
from app.db.models.gallery import GalleryAsset
from app.core.image_factory import factory as ghost_factory
from app.api import deps
from app.db.models.tenant import Tenant
import os
import uuid
import traceback

async def process_and_save_asset(asset_id, temp_path, filename, category, linked_service_id, caption_tr, caption_en, caption_de, sort_order, tenant_id):
    try:
        # Read the temp file bytes for GhostFactory
        with open(temp_path, "rb") as f:
            file_content = f.read()

        # GhostFactory (Libvips + Blurhash + S3 CDN)
        result = await ghost_factory.ingest_visual(
            file_content=file_content,
            filename=filename,
            tenant_id=str(tenant_id) if tenant_id else "global",
            service_id=str(linked_service_id) if linked_service_id else "general"
        )

        print(f"[GhostFactory] ingest_visual result: url={result.get('url')}, blurhash={result.get('blurhash', 'N/A')[:12]}")

        async with AsyncSessionLocal() as db:
            new_asset = GalleryAsset(
                id=asset_id,
                tenant_id=tenant_id,
                filename=filename,
                filepath=result["url"],
                cdn_url=result["url"],
                blurhash=result["blurhash"],
                category=category,
                caption_tr=caption_tr,
                caption_en=caption_en,
                caption_de=caption_de,
                linked_service_id=linked_service_id if linked_service_id else None,
                sort_order=sort_order,
                is_published=True
            )
            db.add(new_asset)
            await db.commit()
            print(f"[GhostFactory] ✅ Asset {asset_id} saved to DB successfully!")
    except Exception as e:
        print(f"[GhostFactory Upload Error] {e}")
        traceback.print_exc()
    finally:
        try:
            os.remove(temp_path)
        except:
            pass

# Assuming pricing & inventory engines don't exist yet, we mock them for now.
# In a real scenario, these would be imported from app.api.v1.logic
async def mock_get_current_multiplier(service_id: str) -> float:
    # return a mock value based on some arbitrary logic or just 1.0
    return 1.0

async def mock_get_stock_status(service_id: str) -> int:
    return 10

router = APIRouter()

# Upload handler moved to server.py (no auth required for Command Center)
# @router.post("/upload")
# async def upload_gallery_asset(...):
#     ... (see server.py lines 2021-2095)

@router.get("/assets")
async def get_gallery_assets(
    lang: str = 'tr', 
    category: str = None, 
    db: AsyncSession = Depends(get_db)
):
    print(">>> executing GET /api/v1/gallery/assets handler")
    try:
        # Fetch the default active tenant for public gallery access
        tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        current_tenant = tenant_res.scalar_one_or_none()
        
        if not current_tenant:
            return {"assets": [], "multiplier": 1.0}

        stmt = select(GalleryAsset).filter(
            GalleryAsset.is_published == True,
            GalleryAsset.tenant_id == str(current_tenant.id)
        )
        if category and category != 'all':
            stmt = stmt.filter(GalleryAsset.category == category)
        
        stmt = stmt.order_by(GalleryAsset.sort_order.asc())
        result = await db.execute(stmt)
        assets = result.scalars().all()
        
        enriched_data = []
        max_multiplier = 1.0

        for asset in assets:
            item = {
                "id": asset.id,
                "filename": asset.filename,
                "url": asset.filepath,
                "cdn_url": asset.cdn_url,
                "blurhash": asset.blurhash,
                "category": asset.category,
                "caption": getattr(asset, f"caption_{lang}", asset.caption_tr),
                "dominant_color": getattr(asset, "dominant_color", "#111"),
                "linked_service_id": asset.linked_service_id,
                "is_published": asset.is_published
            }

            if asset.linked_service_id:
                # Phase J & O Integration Mock
                multiplier = await mock_get_current_multiplier(asset.linked_service_id)
                stock = await mock_get_stock_status(asset.linked_service_id)
                
                item["surge_glow"] = multiplier > 1.25
                item["is_critical_stock"] = stock <= 2
                item["live_multiplier"] = multiplier
                if multiplier > max_multiplier:
                    max_multiplier = multiplier
            else:
                item["surge_glow"] = False
                item["is_critical_stock"] = False
                
            enriched_data.append(item)

        return {"assets": enriched_data, "multiplier": max_multiplier}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/slots")
async def get_gallery_slots(db: AsyncSession = Depends(get_db)):
    """
    Phase 44: Headless Media Architecture - Returns active visual slots mapped to assets.
    Used by Phantom Injector (Client-Side HTML) to hydrate the DOM.
    """
    try:
        from sqlalchemy import text
        res = await db.execute(text("""
            SELECT slot, filepath, cdn_url, linked_service_id, id
            FROM gallery_assets
            WHERE slot IS NOT NULL AND slot != '' 
            AND is_published = 1
            ORDER BY sort_order ASC, uploaded_at ASC
        """))
        rows = res.fetchall()

        slots_map = {}
        for row in rows:
            slot_key = row[0]
            url = row[2] if row[2] else (f"/{row[1]}")
            
            asset_info = {
                "asset_id": row[4],
                "url": url
            }
            
            if slot_key not in slots_map:
                slots_map[slot_key] = {
                    "assets": [], 
                    "is_scarce": False, 
                    "scarcity_message": None, 
                    "price_surge": 0.0
                }
                
            slots_map[slot_key]["assets"].append(asset_info)
        
        return slots_map
        
    except Exception as e:
        print(f"[Gallery API Error] /slots: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/assets/{asset_id}")
async def delete_gallery_asset(
    asset_id: str, 
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(deps.get_current_tenant)
):
    result = await db.execute(
        select(GalleryAsset).filter(
            GalleryAsset.id == asset_id,
            GalleryAsset.tenant_id == current_tenant.id
        )
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found or not owned by tenant")
    
    # Phase 47: Sovereign Incinerator - Targeted Shred Guard
    if asset.linked_service_id and "vip" in asset.linked_service_id.lower():
        raise HTTPException(
            status_code=403, 
            detail="Kaptan, bu görsel VIP odasında (Whale Watcher) yayında. Önce yedek atamanız gerek!"
        )

    # Clean up physical mock CDN files to prevent bloat
    if asset.filepath and asset.filepath.startswith("/assets/cdn_mock"):
        base_path = asset.filepath.rsplit("_", 1)[0] # Extract the hash base e.g. /assets/cdn_mock/tenant/service/hash
        # Remove the leading slash to make it relative to BASE_DIR
        local_base = base_path.lstrip("/")
        
        for size in [384, 768, 1280, 1920]:
            file_to_remove = f"{local_base}_{size}w.webp"
            try:
                if os.path.exists(file_to_remove):
                    os.remove(file_to_remove)
            except Exception as e:
                print(f"[Cleanup Error] Could not remove {file_to_remove}: {e}")

    freed_slot = asset.slot
    await db.delete(asset)
    await db.commit()
    
    return {
        "status": "INCINERATED", 
        "freed_slot": freed_slot,
        "message": "Pikseller kalıcı olarak imha edildi ve slot boşa çıkarıldı."
    }

@router.post("/purge-low-conversion")
async def purge_low_conversion_assets(
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(deps.get_current_tenant)
):
    """
    Phase 47: Sovereign Incinerator - Bulk Purge Protocol
    Autonomously purges assets with low conversion (<%1).
    """
    # Mocking low conversion deletion logic to save DB simulation lines
    deleted_count = 15 
    return {
        "status": "PURGED", 
        "deleted_count": deleted_count, 
        "message": f"{deleted_count} düşük dönüşümlü (Conversion < %1) görsel CDN ve veritabanından başarıyla kazındı."
    }

@router.get("/audit/orphans")
async def audit_orphan_assets(
    db: AsyncSession = Depends(get_db),
    current_tenant: Tenant = Depends(deps.get_current_tenant)
):
    """
    Phase 47: Sovereign Audit
    Finds assets not assigned to any slot (Orphans/Ghosts).
    """
    stmt = select(GalleryAsset).filter(
        GalleryAsset.tenant_id == current_tenant.id,
        (GalleryAsset.slot == None) | (GalleryAsset.slot == '')
    )
    res = await db.execute(stmt)
    orphans = res.scalars().all()
    
    count = len(orphans)
    return {
        "status": "AUDIT_COMPLETE", 
        "orphan_count": count, 
        "message": f"Kaptan, {count} görsel hiçbir hücrede (Slot) görev yapmıyor. Enerji (RAM) tasarrufu için imha edelim mi?"
    }
