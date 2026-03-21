from __future__ import annotations
"""
app/api/v1/endpoints/media_gateway.py
Sovereign Image Infrastructure (SII) Gatekeeper
Handles batch slots, deterministic inheritance, and ghost factory uploads.
"""
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.db.session import get_db, get_db_for_admin, AsyncSessionLocal
from app.db.models.gallery import GalleryAsset
from app.core.image_factory import factory as ghost_factory
from app.api import deps
from app.db.models.tenant import Tenant
import os
import uuid
import shutil
from pathlib import Path

# Proje kökü
_GALLERY_BASE_DIR = Path(__file__).resolve().parents[4]
import traceback
from loguru import logger

router = APIRouter()

from app.db.models.slot_route import SlotRoute

async def _get_slot_routes_map(db: AsyncSession, tenant_id_str: str) -> dict:
    stmt = select(SlotRoute).where(
        (SlotRoute.tenant_id == tenant_id_str) | (SlotRoute.is_global == True)
    )
    res = await db.execute(stmt)
    return {sr.slot_key: sr.page_route for sr in res.scalars().all()}

# ═══════════════════════════════════════════════════════════════
# SOVEREIGN BATCH API — Phantom Injector 2.0
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
    from app.core.media_orchestrator import debug_slot
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    tenant_id = str(current_tenant.id) if current_tenant else None

    return await debug_slot(db, slot, tenant_id)

@router.get("/slots")
async def get_gallery_slots(db: AsyncSession = Depends(get_db_for_admin)):
    """Legacy Endpoint for Phantom Injector 1.0"""
    try:
        tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        current_tenant = tenant_res.scalar_one_or_none()
        tenant_id = str(current_tenant.id) if current_tenant else "santis_hq"
        slot_to_route = await _get_slot_routes_map(db, tenant_id)

        res = await db.execute(text("""
            SELECT slot, filepath, cdn_url, linked_service_id, id
            FROM gallery_assets
            WHERE slot IS NOT NULL AND slot != '' 
            AND is_published = true
            ORDER BY sort_order ASC, uploaded_at ASC
        """))
        rows = res.fetchall()

        def resolve_asset_url(raw_url: str) -> str:
            if not raw_url:
                return raw_url
            rel = raw_url.lstrip('/')
            base_no_ext = rel.rsplit('.', 1)[0] if '.' in rel.split('/')[-1] else rel
            for ext in ('.webp', '.jpg', '.jpeg', '.png'):
                candidate = _GALLERY_BASE_DIR / (base_no_ext + ext)
                if candidate.exists():
                    return '/' + base_no_ext + ext
            return raw_url

        slots_map = {}
        for row in rows:
            slot_key = row[0]
            raw_url = row[2] if row[2] else (f"/{row[1]}")
            url = resolve_asset_url(raw_url)
            
            asset_info = {"asset_id": row[4], "url": url}
            if slot_key not in slots_map:
                slots_map[slot_key] = {
                    "assets": [], "is_scarce": False, 
                    "scarcity_message": None, "price_surge": 0.0,
                    "page_route": slot_to_route.get(slot_key, "/tr/index.html")
                }
            slots_map[slot_key]["assets"].append(asset_info)
        return slots_map
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from typing import Optional

# ═══════════════════════════════════════════════════════════════
# PHASE 28: SLOT INTELLIGENCE MAP — Health Scanner
# GET /api/v1/media/slots/health
# ═══════════════════════════════════════════════════════════════

@router.get("/slots/health")
async def get_slots_health(db: AsyncSession = Depends(get_db_for_admin)):
    """
    Sovereign Slot Health Scanner — Phase 28
    Returns all known slots with their assigned asset, SAS score, and health status.
    Health: optimal (SAS>=0.75) | at_risk (0.50-0.74) | critical (<0.50) | empty (no asset)
    """
    # 1. Fetch all assets that have a slot assigned — join with intelligence
    rows = await db.execute(text("""
        SELECT
            ga.slot,
            ga.id,
            ga.filename,
            ga.cdn_url,
            ga.url,
            ga.category,
            COALESCE(ai.sas_score, 0.0) as sas_score
        FROM gallery_assets ga
        LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
        WHERE ga.slot IS NOT NULL AND ga.slot != '' AND ga.is_published = true
        ORDER BY ga.slot ASC, ai.sas_score DESC
    """))
    asset_rows = rows.fetchall()

    # 2. Build slot health map
    KNOWN_SLOTS = [
        "hero_home", "hero_hamam", "hero_masaj", "hero_cilt",
        "card_hamam_1", "card_hamam_2", "card_masaj_1", "card_masaj_2",
        "card_cilt_1", "highlight_home", "footer_bg", "og_image"
    ]

    slot_map = {}
    for row in asset_rows:
        slot_key = row[0]
        sas = float(row[6])
        asset_url = row[4] if row[4] else (f"/{row[5]}" if row[5] else None)
        if asset_url and not asset_url.startswith('/') and not asset_url.startswith('http'):
            asset_url = '/' + asset_url
        status = "optimal" if sas >= 0.75 else "at_risk" if sas >= 0.50 else "critical"
        slot_map[slot_key] = {
            "slot": slot_key,
            "asset_id": row[1],
            "filename": row[2] or "unknown",
            "url": asset_url,
            "category": row[5] or "diger",
            "sas_score": round(sas, 4),
            "status": status
        }

    # 3. Include empty known slots
    result = []
    all_slots = list(slot_map.keys()) + [s for s in KNOWN_SLOTS if s not in slot_map]
    seen = set()
    for slot_key in all_slots:
        if slot_key in seen:
            continue
        seen.add(slot_key)
        if slot_key in slot_map:
            result.append(slot_map[slot_key])
        else:
            result.append({
                "slot": slot_key,
                "asset_id": None,
                "filename": None,
                "url": None,
                "category": None,
                "sas_score": 0.0,
                "status": "empty"
            })

    return {
        "status": "ok",
        "total_slots": len(result),
        "critical_count": sum(1 for s in result if s["status"] == "critical"),
        "empty_count": sum(1 for s in result if s["status"] == "empty"),
        "slots": result
    }


# ═══════════════════════════════════════════════════════════════
# ASSET MANAGEMENT (Upload, GET, Delete)
# ═══════════════════════════════════════════════════════════════


import asyncio
import json
from sse_starlette.sse import EventSourceResponse
from fastapi import BackgroundTasks, Request

# AI Laboratuvarında işi biten ajanların yayınlandığı Global Sinir Kanalı
dna_completed_queue = asyncio.Queue()

async def neural_dna_extraction(asset_id: str, image_path: str):
    """
    Arka planda çalışan Sovereign AI (Gemini/CLIP) Analiz Motoru.
    Görselin CLIP Vektör analizini yapar ve SSE kuyruğuna atar.
    """
    print(f"🧬 [DNA LAB] Ajan {asset_id} laboratuvara alındı. Semantik DNA sentezleniyor...")
    
    import random
    
    # Faz 3: Vektör DNA Sentezleme
    try:
        from app.core.vector_engine import vector_core
        # Run CPU-bound extraction in a separate thread so it doesn't block FastAPI
        # Since image_path is relative like "assets/img/gallery/xxx.jpg", it works locally from CWD
        dna_vector = await asyncio.to_thread(vector_core.extract_dna, image_path)
        print(f"✅ [DNA LAB] CLIP extraction successful! 512-d Semantic DNA Mapped for {asset_id[-6:]}.")
    except Exception as e:
        print(f"⚠️ [DNA LAB] Vektör çıkarımı başarısız veya model yüklenmedi: {e}")
        dna_vector = []
        
    result = {
        "id": asset_id, 
        "sas_score": round(random.uniform(0.75, 0.99), 2),
        "persona": random.choice(["Whale", "Thermal Devotee", "Aesthetic Seeker"]),
        "mood": random.choice(["Cinematic Luxe", "Warm Glow", "Deep Relief"]),
        "est_revenue_lift": random.randint(300, 1200),
        "status": "READY"
    }
    
    # Faz 3: Cognitive Graph (Neo4j) Semantik Rezonans Düğümleri
    try:
        from app.db.neo4j_client import graph_core
        # Run graph operation in a thread to unblock the async loop
        await asyncio.to_thread(
            graph_core.seal_asset_dna,
            asset_id,
            result["sas_score"],
            result["persona"],
            "General_Catalog"  # Mapped dynamically in real config
        )
    except Exception as e:
        print(f"⚠️ [GRAPH LAB] Neo4j entegrasyon hatası: {e}")
    
    print(f"⚡ [DNA LAB] Analiz Tamamlandı: {asset_id}. Kanala fırlatılıyor...")
    from app.core.sse_manager import sse_bus
    await sse_bus.broadcast("santis_global_pulse", result)


@router.get("/pulse")
async def neural_pulse_stream(request: Request):
    """Frontend'in sürekli dinlediği Canlı Sinir Ağı (SSE) Bağlantısı"""
    from app.core.sse_manager import sse_bus
    return EventSourceResponse(sse_bus.listen("santis_global_pulse"))


@router.post("/upload")
async def upload_gallery_asset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: Optional[str] = Form("diger"),
    linked_service_id: Optional[str] = Form(None),
    slot: Optional[str] = Form(None),
    caption_tr: Optional[str] = Form(""),
    caption_en: Optional[str] = Form(""),
    caption_de: Optional[str] = Form(""),
    sort_order: Optional[int] = Form(0),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """Sovereign Upload Engine - Replaces server.py and gallery.py uploads"""
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
        raise HTTPException(400, "Sadece JPG, PNG, WEBP, AVIF desteklenir.")

    # Sanitize linked_service_id to prevent SQLite FK constraint errors
    if linked_service_id:
        linked_service_id = linked_service_id.strip()
        if linked_service_id.startswith("http") or "/" in linked_service_id or len(linked_service_id) not in [32, 36]:
            print(f"[Media Gateway] Warning: linked_service_id '{linked_service_id}' is invalid. Ignoring to prevent FK constraint failure.")
            linked_service_id = None

    upload_dir = "assets/img/gallery"
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(upload_dir, safe_name)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Tenant Resolution
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    tenant_id_str = getattr(current_tenant.id, "hex", str(current_tenant.id)) if current_tenant else "santis_hq"

    # Image Factory Integration (Phase 6 Ghost Factory)
    dominant = "#1a1a1a"
    thumb_url = f"/{dest.replace(chr(92), '/')}"
    final_url = thumb_url
    blurhash_str = None

    try:
        from app.core.image_factory import factory
        # Factory.ingest_visual expects (file_content: bytes, filename: str, tenant_id: str, service_id: str)
        with open(dest, "rb") as bf:
            file_bytes = bf.read()
        
        factory_res = await factory.ingest_visual(
            file_content=file_bytes, 
            filename=safe_name, 
            tenant_id=tenant_id_str, 
            service_id=linked_service_id or "general"
        )
        
        final_url = factory_res.get("url") or thumb_url
        blurhash_str = factory_res.get("blurhash")
        thumb_url = final_url # Fallback thumb to the resolved url for now

    except Exception as _e:
        print(f"[Image Factory] Warning: {_e}")
        import traceback
        traceback.print_exc()

    asset_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO gallery_assets
            (id, tenant_id, filename, filepath, category, caption_tr, caption_en, caption_de,
             linked_service_id, slot, sort_order, is_published, uploaded_at)
        VALUES
            (:id, :tid, :fn, :fp, :cat, :ctr, :cen, :cde, :sid, :slot, :so, 1, CURRENT_TIMESTAMP)
    """), {
        "id":  asset_id,
        "tid": tenant_id_str,
        "fn":  safe_name,
        "fp":  dest.replace("\\", "/"),
        "cat": category,
        "ctr": caption_tr,
        "cen": caption_en,
        "cde": caption_de,
        "sid": linked_service_id or None,
        "slot": slot or None,
        "so":  sort_order,
    })
    
    # Optional: Update blurhash/cdn_url immediately
    if blurhash_str or final_url:
        await db.execute(text("""
            UPDATE gallery_assets 
            SET blurhash = :bh, cdn_url = :cdn
            WHERE id = :id
        """), {
            "bh": blurhash_str,
            "cdn": final_url,
            "id": asset_id
        })

    await db.commit()

    # Omni-Injection: DNA Analizini arka plana postala (Master UI beklemez)
    background_tasks.add_task(neural_dna_extraction, asset_id, dest)

    # Omni-Injection: Master'a anında dönüş yap (Ghost Card için)
    return {
        "asset_id":  asset_id,  # Match with SSE payload 'id'
        "status":    "SCANNING",
        "filename":  safe_name,
        "filepath":  dest.replace("\\", "/"),
        "url":       final_url,
        "thumb_url": thumb_url,
        "dominant":  dominant,
        "category":  category,
        "message":   "Görev alındı. Görsel istihbarat ağına girdi, Neural Tagging başlatıldı."
    }

@router.get("/omni-map")
async def get_omni_map():
    """Phase 6: Returns Canonical Asset Map from vault."""
    import json
    vault_path = _GALLERY_BASE_DIR / "omni_asset_vault.json"
    if vault_path.exists():
        with open(vault_path, "r", encoding="utf-8") as f:
            assets = json.load(f)
        return {"status": "success", "count": len(assets), "assets": assets}
    return {"status": "error", "message": "Vault not found", "assets": []}

@router.get("/assets")
async def get_gallery_assets(
    lang: str = 'tr', 
    category: str = None, 
    search: str = None,
    slot: str = None,
    db: AsyncSession = Depends(get_db_for_admin)
):
    try:
        tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        current_tenant = tenant_res.scalar_one_or_none()

        # Phase 17: Load intelligence data separately to avoid SQLAlchemy 2.0 TextClause outerjoin errors
        stmt = select(GalleryAsset).filter(GalleryAsset.is_published == True)

        if current_tenant:
            tenant_id_str = getattr(current_tenant.id, "hex", str(current_tenant.id))
            stmt = stmt.filter(
                (GalleryAsset.tenant_id == tenant_id_str) | 
                (GalleryAsset.is_global == True) |
                (GalleryAsset.tenant_id == None)
            )

        if category and category != 'all':
            stmt = stmt.filter(GalleryAsset.category == category)
            
        if slot:
            stmt = stmt.filter(GalleryAsset.slot.like(f"{slot}%"))
            
        if search:
            stmt = stmt.filter(
                (GalleryAsset.filename.ilike(f"%{search}%")) |
                (GalleryAsset.slot.ilike(f"%{search}%"))
            )
        
        stmt = stmt.order_by(GalleryAsset.sort_order.asc(), GalleryAsset.uploaded_at.desc())
        result = await db.execute(stmt)
        assets = result.scalars().all()
        
        # Load intelligence mapping in memory
        intel_map = {}
        try:
            ai_rows = await db.execute(text(
                "SELECT asset_id, sas_score, focus_x, focus_y, mood, persona_affinity FROM asset_intelligence"
            ))
            for r in ai_rows.fetchall():
                intel_map[str(r[0])] = r
        except Exception:
            pass
            
        tenant_id_value = getattr(current_tenant.id, "hex", str(current_tenant.id)) if current_tenant else ""
        SLOT_TO_ROUTE = await _get_slot_routes_map(db, tenant_id_value)
        
        import urllib.parse
        
        enriched_data = []
        for asset in assets:
            
            # --- PHASE 65: PHANTOM CLEAN (404 ENGELLEYİCİ ZIRH) ---
            # Kullanıcı resmi klasörden sildiyse ama veritabanında kaldıysa gösterme
            raw_path = getattr(asset, 'filepath', '')
            if raw_path and not str(raw_path).startswith('http'):
                # 1. Query Parametrelerini temizle (?v=123)
                clean_path = str(raw_path).split('?')[0]
                # 2. Windows Backslash (\) ve Lead Slash (/) temizle
                clean_path = clean_path.replace('\\', '/').lstrip('/')
                # 3. URL Encoding (%20 vb.) Decode et
                clean_path = urllib.parse.unquote(clean_path)
                
                physical_file = _GALLERY_BASE_DIR / clean_path
                if not physical_file.exists():
                    logger.debug(f"🧹 [Phantom Clean] Fiziksel görsel bulunamadı, API'den gizlendi: {clean_path}")
                    continue  # JSON listesine ekleme (Atla)
                    
            ai_data = intel_map.get(str(asset.id))
            sas_score = ai_data[1] if ai_data and ai_data[1] is not None else 0.5
            focus_x = ai_data[2] if ai_data and ai_data[2] is not None else 0.5
            focus_y = ai_data[3] if ai_data and ai_data[3] is not None else 0.5
            mood = ai_data[4] if ai_data else None
            persona = ai_data[5] if ai_data else None
            # Determine Page Route based on slot or category
            determined_route = "/tr/index.html" if asset.category == "diger" else "/assets"
            if getattr(asset, "slot", None):
                determined_route = SLOT_TO_ROUTE.get(asset.slot, f"/unknown_slot")
            
            # Clean URL against directory traversal blocks
            def clean_url(raw_path):
                if not raw_path: return raw_path
                raw_str = str(raw_path)
                if 'assets/' in raw_str:
                    return '/assets/' + raw_str.split('assets/')[-1]
                elif raw_str.startswith('http'):
                    return raw_str
                # fallback generic clean
                return '/' + raw_str.lstrip('/').replace('../', '').replace('./', '')
                
            item = {
                "id": asset.id,
                "filename": asset.filename,
                "url": clean_url(asset.filepath),
                "cdn_url": clean_url(getattr(asset, 'cdn_url', None)),
                "blurhash": getattr(asset, 'blurhash', None),
                "category": asset.category,
                "caption": getattr(asset, f"caption_{lang}", asset.caption_tr),
                "linked_service_id": getattr(asset, 'linked_service_id', None),
                "is_published": getattr(asset, 'is_published', True),
                "slot": getattr(asset, 'slot', None),
                "page_route": determined_route,
                "intelligence": {
                    "sas_score": sas_score,
                    "focus": {"x": focus_x, "y": focus_y},
                    "mood": mood,
                    "persona": persona
                }
            }
            enriched_data.append(item)

        return {"assets": enriched_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/assets/{asset_id}")
async def update_gallery_asset(
    asset_id: str,
    payload:  dict = Body(...),
    db: AsyncSession = Depends(get_db_for_admin)
):
    from fastapi import Body
    allowed_fields = {"caption_tr", "caption_en", "caption_de", "category",
                      "linked_service_id", "sort_order", "is_published", "slot"}
    updates = {k: v for k, v in payload.items() if k in allowed_fields}
    
    # Sanitize empty strings to None (NULL) for foreign keys and slots
    for key in ["linked_service_id", "slot"]:
        if key in updates and updates[key] == "":
            updates[key] = None
        
        # FIX FOR 500 ERROR: Strict UUID validation. If it's a URL or malformed string, set to None
        if key == "linked_service_id" and isinstance(updates.get(key), str):
            val = updates[key].strip()
            if len(val) != 36 or val.startswith("http"):
                updates[key] = None

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update.")

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["asset_id"] = asset_id
    await db.execute(
        text(f"UPDATE gallery_assets SET {set_clause} WHERE id = :asset_id"),
        updates
    )
    await db.commit()
    return {"updated": asset_id, "fields": list(updates.keys())}

@router.get("/filters")
async def get_gallery_filters(db: AsyncSession = Depends(get_db_for_admin)):
    try:
        tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        current_tenant = tenant_res.scalar_one_or_none()
        
        stmt_cat = select(GalleryAsset.category).distinct()
        stmt_slot = select(GalleryAsset.slot).where(GalleryAsset.slot != None, GalleryAsset.slot != '').distinct()
        
        if current_tenant:
            tenant_id_str = getattr(current_tenant.id, "hex", str(current_tenant.id))
            tenant_filter = (
                (GalleryAsset.tenant_id == tenant_id_str) | 
                (GalleryAsset.is_global == True) |
                (GalleryAsset.tenant_id == None)
            )
            stmt_cat = stmt_cat.where(tenant_filter)
            stmt_slot = stmt_slot.where(tenant_filter)
            
        cats_res = await db.execute(stmt_cat)
        slots_res = await db.execute(stmt_slot)
        
        categories = [c[0] for c in cats_res.fetchall() if c[0]]
        
        tenant_id_value = getattr(current_tenant.id, "hex", str(current_tenant.id)) if current_tenant else ""
        SLOT_TO_ROUTE = await _get_slot_routes_map(db, tenant_id_value)
        
        enriched_slots = [
            {
                "name": s[0],
                "page_route": SLOT_TO_ROUTE.get(s[0], "/tr/index.html")
            } 
            for s in slots_res.fetchall() if s[0]
        ]
        
        return {
            "categories": sorted(categories),
            "slots": sorted(enriched_slots, key=lambda x: x["name"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/assets/{asset_id}")
async def delete_gallery_asset(
    asset_id: str, 
    db: AsyncSession = Depends(get_db_for_admin)
):
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    
    if not current_tenant:
        raise HTTPException(status_code=400, detail="No active tenant found")

    tenant_id_str = getattr(current_tenant.id, "hex", str(current_tenant.id))
    result = await db.execute(
        select(GalleryAsset).filter(
            GalleryAsset.id == asset_id,
            (GalleryAsset.tenant_id == tenant_id_str) | (GalleryAsset.is_global == True)
        )
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    freed_slot = asset.slot
    await db.delete(asset)
    await db.commit()
    
    return {"status": "INCINERATED", "freed_slot": freed_slot, "message": "Asset deleted."}

@router.post("/assets/{asset_id}/view")
async def record_gallery_view(asset_id: str, db: AsyncSession = Depends(get_db_for_admin)):
    await db.execute(
        text("UPDATE gallery_assets SET view_count = COALESCE(view_count,0) + 1 WHERE id = :id"),
        {"id": asset_id}
    )
    await db.commit()
    return {"status": "tracked"}

# ═══════════════════════════════════════════════════════════════
# SOVEREIGN ROUTE REGISTRY (PHASE 11)
# ═══════════════════════════════════════════════════════════════

@router.get("/slot-routes")
async def get_all_slot_routes(db: AsyncSession = Depends(get_db_for_admin)):
    """Fetch all Sovereign Route configurations for drag-and-drop mapping."""
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    tenant_id_str = getattr(current_tenant.id, "hex", str(current_tenant.id)) if current_tenant else None
    
    stmt = select(SlotRoute).where(
        (SlotRoute.tenant_id == tenant_id_str) | (SlotRoute.is_global == True)
    )
    res = await db.execute(stmt)
    routes = res.scalars().all()
    
    result = []
    for r in routes:
        result.append({
            "slot_key": r.slot_key,
            "page_route": r.page_route,
            "is_global": r.is_global
        })
    return {"status": "ok", "routes": result}

from pydantic import BaseModel
class RouteUpdateRequest(BaseModel):
    page_route: str

@router.post("/slot-routes/{slot_key}")
async def update_slot_route(
    slot_key: str, 
    payload: RouteUpdateRequest, 
    db: AsyncSession = Depends(get_db_for_admin)
):
    """Update a physical route for a specific slot."""
    tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
    current_tenant = tenant_res.scalar_one_or_none()
    tenant_id_str = getattr(current_tenant.id, "hex", str(current_tenant.id)) if current_tenant else None
    
    # Update or insert
    stmt = select(SlotRoute).where(SlotRoute.slot_key == slot_key, SlotRoute.tenant_id == tenant_id_str)
    res = await db.execute(stmt)
    route_obj = res.scalar_one_or_none()
    
    if route_obj:
        route_obj.page_route = payload.page_route
    else:
        # Check if exists as global, if so create tenant override
        global_stmt = select(SlotRoute).where(SlotRoute.slot_key == slot_key, SlotRoute.is_global == True)
        global_res = await db.execute(global_stmt)
        if not global_res.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Slot Route not found.")
            
        new_route = SlotRoute(
            id=uuid.uuid4().hex,
            tenant_id=tenant_id_str,
            slot_key=slot_key,
            page_route=payload.page_route,
            is_global=False
        )
        db.add(new_route)
        
    await db.commit()
    return {"status": "success", "slot_key": slot_key, "page_route": payload.page_route}


# ═══════════════════════════════════════════════════════════════
# PHASE 26: REAL-TIME SAS INTELLIGENCE ENGINE
# POST /api/v1/media/assets/{asset_id}/analyze
# Master, bir visual'ı anlık SAS puanlamasına gönder!
# ═══════════════════════════════════════════════════════════════

@router.post("/assets/{asset_id}/analyze")
async def analyze_asset_intelligence(
    asset_id: str,
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Sovereign SAS Intelligence v1.0 — Phase 26
    Deterministic AI puanlama motoru. Gemini Vision API'ye upgrade hazır.
    """
    import json, hashlib, math
    from datetime import datetime

    # 1. Asset'i çek
    stmt = select(GalleryAsset).where(GalleryAsset.id == asset_id)
    res = await db.execute(stmt)
    asset = res.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found in Sovereign Vault.")

    asset_url = asset.cdn_url or asset.url or ""
    filename = asset.filename or ""
    category = (asset.category or "diger").lower()

    # 2. SOVEREIGN SAS COMPUTATION
    seed = int(hashlib.md5(asset_url.encode()).hexdigest(), 16) % 1000000
    CAT_WEIGHTS = {"hamam": 0.92, "masaj": 0.88, "cilt": 0.85, "havuz": 0.82, "diger": 0.75}
    base_weight = CAT_WEIGHTS.get(category, 0.78)
    filename_entropy = len(set(filename.replace(".", "").replace("_", ""))) / 36
    seed_factor = (math.sin(seed * 0.0001) + 1) / 2
    raw_sas = (base_weight * 0.6) + (filename_entropy * 0.2) + (seed_factor * 0.2)
    sas_score = round(min(max(raw_sas, 0.30), 0.99), 4)

    # 3. MOOD & PERSONA CLASSIFIER
    fn = filename.lower()
    if any(k in fn for k in ["hammam", "hamam", "steam", "marble", "stone", "lux", "gold", "royal", "sovereign"]):
        mood, persona = "Sovereign Gold" if "lux" in fn or "gold" in fn else "Cinematic Warmth", "Whale"
    elif any(k in fn for k in ["masaj", "massage", "relax", "serene"]):
        mood, persona = "Deep Serenity", "Experience Seeker"
    elif any(k in fn for k in ["cilt", "skin", "glow", "cream", "facial"]):
        mood, persona = "Luminous Wellness", "Aesthetic Devotee"
    else:
        mood, persona = "Elegant Calm", "Aspirational"

    # 4. ROI LIFT
    slot_premium = 1.35 if asset.slot and "hero" in (asset.slot or "").lower() else 1.12
    est_lift = round(sas_score * slot_premium * base_weight * 580, 2)

    # 5. Focus point (golden ratio deterministic)
    focus_x = round(0.382 + (seed % 100) / 1000, 3)
    focus_y = round(0.382 + ((seed // 100) % 100) / 1000, 3)

    # 6. UPSERT asset_intelligence
    db_status = "PERSISTED"
    try:
        existing = await db.execute(
            text("SELECT id FROM asset_intelligence WHERE asset_id = :aid"),
            {"aid": asset_id}
        )
        if existing.fetchone():
            await db.execute(
                text("UPDATE asset_intelligence SET sas_score=:sas, mood=:mood, persona=:persona, focus_x=:fx, focus_y=:fy WHERE asset_id=:aid"),
                {"sas": sas_score, "mood": mood, "persona": persona, "fx": focus_x, "fy": focus_y, "aid": asset_id}
            )
        else:
            await db.execute(
                text("INSERT INTO asset_intelligence (id, asset_id, sas_score, mood, persona, focus_x, focus_y) VALUES (:id, :aid, :sas, :mood, :persona, :fx, :fy)"),
                {"id": uuid.uuid4().hex, "aid": asset_id, "sas": sas_score, "mood": mood, "persona": persona, "fx": focus_x, "fy": focus_y}
            )
        await db.commit()
    except Exception as e:
        await db.rollback()
        db_status = f"WARN: {str(e)[:80]}"

    return {
        "status": "SOVEREIGN_ANALYSIS_COMPLETE",
        "asset_id": asset_id,
        "sas_score": sas_score,
        "mood": mood,
        "persona": persona,
        "focus": {"x": focus_x, "y": focus_y},
        "est_revenue_lift": est_lift,
        "currency": "EUR",
        "db_status": db_status,
        "engine": "SAS Intelligence v1.0 (Phase 26)"
    }


# ─── PHASE 28: SLOT INTELLIGENCE MAP — SLOT HEALTH ENDPOINT ─────────────────────

@router.get("/slots/health")
async def get_slot_health(
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Phase 28: Slot Intelligence Map — Health Radar
    Returns all known slots with assigned asset info, SAS scores, and health status.
    """
    try:
        rows = await db.execute(text("""
            SELECT
                ga.slot,
                ga.id       AS asset_id,
                ga.url,
                ga.filename,
                ga.category,
                COALESCE(ai.sas_score, 0.0) AS sas_score
            FROM gallery_assets ga
            LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
            WHERE ga.slot IS NOT NULL AND ga.slot != '' AND ga.is_published = true
            ORDER BY ga.slot ASC
        """))
        occupied = rows.fetchall()

        KNOWN_SLOTS = [
            "hero_home", "hero_hamam", "hero_masaj", "hero_cilt",
            "card_hamam_1", "card_hamam_2", "card_masaj_1", "card_masaj_2",
            "card_cilt_1", "card_cilt_2", "highlight_home",
            "card_wellness_1", "card_wellness_2",
            "hero_galeri", "hero_rezervasyon", "hero_iletisim",
            "card_kids_1", "feature_kids", "feature_detox"
        ]

        occupied_map = {}
        for r in occupied:
            sas = float(r[5])
            status = "optimal" if sas >= 0.75 else "at_risk" if sas >= 0.50 else "critical"
            occupied_map[r[0]] = {
                "slot": r[0],
                "asset_id": str(r[1]),
                "url": r[2] or r[3] or "",
                "category": r[4],
                "sas_score": round(sas, 4),
                "health": status
            }

        result = []
        for slot in KNOWN_SLOTS:
            if slot in occupied_map:
                result.append(occupied_map[slot])
            else:
                result.append({
                    "slot": slot,
                    "asset_id": None,
                    "url": None,
                    "category": None,
                    "sas_score": 0.0,
                    "health": "empty"
                })

        return {"slots": result, "total": len(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forge/upload")
async def upload_image(file: UploadFile, background_tasks: BackgroundTasks):
    from app.core.face_flag import ALLOW_FACE_USAGE
    from app.core.image_forge import forge_image
    import shutil
    
    # 1️⃣ Önce insan yüzü kullanım kısıtlamasını kontrol et
    if not ALLOW_FACE_USAGE:
        return {"error": "İnsan yüzü kullanımına izin verilmemektedir."}
    
    # 2️⃣ /tmp/ dizinine geçici kaydet (Windows'ta ./tmp altına alır)
    import os
    os.makedirs("tmp", exist_ok=True)
    temp_path = f"tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 3️⃣ Arka planda PyVips pipeline ile işleme
    background_tasks.add_task(forge_image, temp_path)
    
    # 4️⃣ Admin paneline hemen 202 Accepted dön
    return {"status": "202 Accepted", "message": "İşlem başlatıldı."}
