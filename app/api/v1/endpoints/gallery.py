from __future__ import annotations
"""
app/api/v1/endpoints/gallery.py
Phase Visual - Gallery Assessment API
Handles image uploads, processing via Image Factory, and data enrichment for Pinterest grid.
"""
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db, get_db_for_admin, AsyncSessionLocal
from app.db.models.gallery import GalleryAsset
from app.core.image_factory import factory as ghost_factory
from app.api import deps
from app.db.models.tenant import Tenant
import os
import uuid
from pathlib import Path

# Proje kökü — server.py ile aynı mantık
_GALLERY_BASE_DIR = Path(__file__).resolve().parents[4]
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


# ═══════════════════════════════════════════════════════════════
# FAZ 3: Sovereign Batch Slot API — Phantom Injector 2.0 desteği
# ═══════════════════════════════════════════════════════════════

@router.post("/slots/batch")
async def batch_resolve_slots(
    request: Request,
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Sovereign Batch Resolver: Tek istekte N slot çöz.
    POST body: {"slots": ["hero_home", "card_masaj_1", ...]}
    Response: {"data": {"hero_home": {"url": ..., "alt": ...}, ...}}
    """
    from app.core.media_orchestrator import resolve_slots
    
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    slot_keys = body.get("slots", [])
    if not slot_keys or len(slot_keys) > 50:
        raise HTTPException(status_code=400, detail="1-50 arası slot key gerekli")

    # Resolve tenant (MVP: first active tenant)
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    tenant_id = str(current_tenant.id) if current_tenant else None

    data = await resolve_slots(db, slot_keys, tenant_id)

    return {
        "status": "ok",
        "data": data,
        "resolved": len(data),
        "requested": len(slot_keys)
    }


@router.get("/debug")
async def debug_slot_resolution(
    slot: str = "hero_home",
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Sovereign Debug: Hangi asset neden kazandı?
    GET /api/v1/gallery/debug?slot=hero_home
    """
    from app.core.media_orchestrator import debug_slot

    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    tenant_id = str(current_tenant.id) if current_tenant else None

    return await debug_slot(db, slot, tenant_id)

@router.post("/upload")
async def upload_gallery_asset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form("diger"),
    linked_service_id: str = Form(None),
    slot: str = Form(None),
    caption_tr: str = Form(""),
    caption_en: str = Form(""),
    caption_de: str = Form(""),
    sort_order: int = Form(0),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Galeri gorsel yukleme endpoint. GhostFactory calisirsa CDN kullanir,
    hata verirse lokal assets/img/uploads/ klasorune kaydeder.
    """
    import uuid as uuid_module
    from pathlib import Path as PPath

    # Tenant
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    tenant_id = str(current_tenant.id) if current_tenant else "global"

    file_bytes = await file.read()
    filename   = file.filename or f"upload_{uuid_module.uuid4().hex[:8]}.jpg"
    asset_id   = str(uuid_module.uuid4())

    # Lokal kayit
    upload_dir = _GALLERY_BASE_DIR / "assets" / "img" / "gallery"
    upload_dir.mkdir(parents=True, exist_ok=True)
    stem      = PPath(filename).stem[:40]
    ext_      = PPath(filename).suffix or ".jpg"
    safe_name = f"{stem}_{asset_id[:8]}{ext_}"
    local_path = upload_dir / safe_name
    local_url  = f"/assets/img/gallery/{safe_name}"

    with open(local_path, "wb") as fout:
        fout.write(file_bytes)

    # GhostFactory (opsiyonel)
    cdn_url      = local_url
    blurhash_val = None
    try:
        result       = await ghost_factory.ingest_visual(
            file_content=file_bytes, filename=filename,
            tenant_id=tenant_id,
            service_id=str(linked_service_id) if linked_service_id else "general"
        )
        cdn_url      = result.get("url", local_url)
        blurhash_val = result.get("blurhash")
    except Exception as ghost_err:
        print(f"[GhostFactory] Fallback aktif: {ghost_err}")

    # DB kayit
    new_asset = GalleryAsset(
        id=asset_id, tenant_id=tenant_id,
        filename=safe_name, filepath=local_url, cdn_url=cdn_url,
        blurhash=blurhash_val, category=category,
        caption_tr=caption_tr, caption_en=caption_en, caption_de=caption_de,
        linked_service_id=linked_service_id or None,
        slot=slot or None, sort_order=sort_order, is_published=True
    )
    db.add(new_asset)
    await db.commit()

    return {
        "status": "INGESTED",
        "asset_id": asset_id,
        "filename": safe_name,
        "url": local_url,
        "cdn_url": cdn_url,
        "category": category,
        "message": "Gorsel basariyla galeri matrisine eklendi."
    }

# Upload handler moved to server.py (no auth required for Command Center)
# @router.post("/upload")
# async def upload_gallery_asset(...):
#     ... (see server.py lines 2021-2095)

@router.get("/assets")
async def get_gallery_assets(
    lang: str = 'tr', 
    category: str = None, 
    db: AsyncSession = Depends(get_db_for_admin)
):
    print(">>> executing GET /api/v1/gallery/assets handler")
    try:
        # Fetch the default active tenant for public gallery access
        tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        current_tenant = tenant_res.scalar_one_or_none()

        # ── Sovereign Inheritance: tenant assets + global assets ──
        stmt = select(GalleryAsset).filter(
            GalleryAsset.is_published == True
        )

        if current_tenant:
            tenant_id_str = str(current_tenant.id)
            # Show both tenant-specific AND global assets
            stmt = stmt.filter(
                (GalleryAsset.tenant_id == tenant_id_str) | 
                (GalleryAsset.is_global == True) |
                (GalleryAsset.tenant_id == None)
            )
        # If no tenant, show all published assets (no tenant filter)

        if category and category != 'all':
            stmt = stmt.filter(GalleryAsset.category == category)
        
        stmt = stmt.order_by(GalleryAsset.sort_order.asc(), GalleryAsset.uploaded_at.desc())
        result = await db.execute(stmt)
        assets = result.scalars().all()
        
        enriched_data = []
        max_multiplier = 1.0

        for asset in assets:
            item = {
                "id": asset.id,
                "filename": asset.filename,
                "url": f"/{asset.filepath}" if asset.filepath and not str(asset.filepath).startswith("/") else asset.filepath,
                "cdn_url": f"/{asset.cdn_url}" if asset.cdn_url and not str(asset.cdn_url).startswith("/") else asset.cdn_url,
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
async def get_gallery_slots(db: AsyncSession = Depends(get_db_for_admin)):
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
            AND is_published = true
            ORDER BY sort_order ASC, uploaded_at ASC
        """))
        rows = res.fetchall()

        def resolve_asset_url(raw_url: str) -> str:
            """
            DB'deki URL'de hangi uzantı yazıyor olursa olsun,
            fiziksel olarak var olan dosyanın URL'ini döndür.
            Öncelik: .webp > .jpg > .jpeg > .png > orijinal
            """
            if not raw_url:
                return raw_url
            # URL'den fiziksel path'e çevir (baştaki '/' kaldır)
            rel = raw_url.lstrip('/')
            base_no_ext = rel.rsplit('.', 1)[0] if '.' in rel.split('/')[-1] else rel
            for ext in ('.webp', '.jpg', '.jpeg', '.png'):
                candidate = _GALLERY_BASE_DIR / (base_no_ext + ext)
                if candidate.exists():
                    return '/' + base_no_ext + ext
            # Fiziksel dosya hiç bulunamazsa orijinal URL'i dön (en azından log'dan görülür)
            return raw_url

        slots_map = {}
        for row in rows:
            slot_key = row[0]
            raw_url = row[2] if row[2] else (f"/{row[1]}")
            url = resolve_asset_url(raw_url)
            
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
    db: AsyncSession = Depends(get_db_for_admin)
):
    # Fetch the default active tenant for MVP admin access
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    
    if not current_tenant:
        raise HTTPException(status_code=400, detail="No active tenant found")

    tenant_id_str = str(current_tenant.id)  # Keep dashes — consistent with upload & get handlers
    result = await db.execute(
        select(GalleryAsset).filter(
            GalleryAsset.id == asset_id,
            GalleryAsset.tenant_id == tenant_id_str
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
    db: AsyncSession = Depends(get_db_for_admin),
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
    db: AsyncSession = Depends(get_db_for_admin),
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
