from __future__ import annotations
from typing import Any, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, update, func
import json
import math
from app.db.models.booking import Booking
from app.db.models.service import Service
from app.db.session import AsyncSessionLocal

from app.db.session import get_db, get_db_for_admin
from app.core.yield_engine import calculate_surge_price
from app.core.i18n import get_language_from_request

router = APIRouter()

_HAMMAM_KW  = {"hammam","hamam","kese","köpük","kopuk","osmanl","bath ritual","ottoman","peeling","bal bak","çikolata","cikolata","alg bak"}
_MASSAGE_KW = {
    "masaj","masajı","massage","terapi","therapy","refleks",
    "drenaj","drainage","shiatsu","thai","bali","sicak","kronyo",
    "kraniyo","kranyo","myofasc","manuel","relax","swedish","isvec",
    "deep tissue","hot stone","aromater","spor","sport","sirt","boyun",
    "lokal","tetik","trigger","kombine","couples","senkron","çift",
    "ayak","lenf","lymph","full body","anti-stress","bronz","isvec",
    "classic","senkron","signature massag",
}
_SKINCARE_KW = {
    "cilt","sothys","bakım","rituel","ritual","vitamin","glass skin",
    "gold mask","led ","led light","radianc","collagen","oksijen","oxygen",
    "purify","purete","hydra","antiage","anti-age","homme","glow",
    "luminous","purity","acne","charcoal","enzyme","eye lift","lip ",
    "micro-p","executive","serum","detox cleanse","urban detox",
    "o2 vital","lumiere","eternal diamond","korean","24k","leke","bariyer",
    "lifting","resurfac","infusion","rejuven","polish","velvet","moisture",
    "hyaluron","sensitive","hassas","oksijen boost",
}
_WELLNESS_KW = {
    "paket","package","journey","zen","sultan","detoks","detox",
    "romantik","romantic","altin","gold ritual","sporcu","recover",
    "ayurveda","kids","cocuk","çocuk","aile","family",
}

def _detect_category(name: str) -> str:
    n = name.lower()
    if any(kw in n for kw in _HAMMAM_KW):
        return "hammam"
    if any(kw in n for kw in _MASSAGE_KW):
        return "massage"
    if any(kw in n for kw in _SKINCARE_KW):
        return "skincare"
    if any(kw in n for kw in _WELLNESS_KW):
        return "wellness"
    return "wellness"  # safe default

def _detect_subcategory(name: str, category: str) -> str:
    n = name.lower()
    if category == "massage":
        if any(kw in n for kw in ["çift", "couple", "senkron"]): return "massage-couples"
        if any(kw in n for kw in ["çocuk", "kid", "anne-çocuk"]): return "massage-kids"
        if any(kw in n for kw in ["spor", "derin", "deep", "sport"]): return "massage-sports"
        if any(kw in n for kw in ["thai", "bali", "shiatsu", "asya", "oriental"]): return "massage-asian"
        if any(kw in n for kw in ["medikal", "kranyo", "miyofasyal", "tetik", "lenf"]): return "massage-medical"
        if any(kw in n for kw in ["baş", "boyun", "omuz", "sırt", "ayak", "refleks", "lokal", "bölge"]): return "massage-regional"
        if any(kw in n for kw in ["signature", "premium", "kraliyet", "sıcak taş"]): return "massage-premium"
        return "massage-relaxation"
    elif category == "skincare":
        if any(kw in n for kw in ["sothys", "sultan", "rituel", "ritual"]):
            if any(kw in n for kw in ["erkek", "homme", "men"]): return "sothys-men"
            if any(kw in n for kw in ["anti-ag", "lifting", "genç", "kolajen", "collagen", "yaşlanma", "jeunesse"]): return "sothys-antiage"
            if any(kw in n for kw in ["nem", "hydra", "su "]): return "sothys-hydra"
            if any(kw in n for kw in ["arındır", "purify", "detox", "akne", "sebum", "kömür", "purete", "lumiere"]): return "sothys-purifying"
            # Some Sothys fallbacks
            if any(kw in n for kw in ["isilti", "korean", "glass skin", "gold", "vitamin c", "diamant", "diamond"]): return "sothys-purifying"
            return "sothys-hydra" # default Sothys
        if any(kw in n for kw in ["anti-ag", "lifting", "genç", "kolajen", "collagen", "yaşlanma", "youth", "definition"]): return "skincare-antiage"
        if any(kw in n for kw in ["nem", "hydra", "oksijen", "oxygen", "hyaluron", "moisture"]): return "skincare-hydra"
        if any(kw in n for kw in ["arındır", "detox", "temizleme", "akne", "sebum", "kömür", "peeling"]): return "skincare-purify"
        if any(kw in n for kw in ["gold", "glass skin", "özel", "premium", "vitamin c", "leke", "aydınlatıcı", "luminous", "radiance", "24k"]): return "skincare-special"
        return "skincare-basic"
    elif category == "hammam":
        return "ritual-hammam"
    return "journey"

# Static fallback path
_SERVICES_JSON = Path(__file__).resolve().parents[4] / "assets" / "data" / "services.json"

@router.get("")
async def get_live_services(
    request: Request,
    tenant_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db_for_admin)
) -> Any:
    """
    Public Endpoint for the Live Pricing Feed.
    Retrieves services and dynamically applies the Surge Engine.
    Falls back to services.json if DB returns empty (development/seed mode).
    """
    try:
        if tenant_id and tenant_id != "santis_hq":
            result = await db.execute(text(
                "SELECT id, tenant_id, name, duration_minutes, price, currency, "
                "current_price_eur, min_price_eur, max_price_eur, demand_multiplier, category, "
                "name_translations, desc_translations "
                "FROM services WHERE is_active=true AND is_deleted=false AND tenant_id=:tid"
            ), {"tid": str(tenant_id)})
        else:
            result = await db.execute(text(
                "SELECT id, tenant_id, name, duration_minutes, price, currency, "
                "current_price_eur, min_price_eur, max_price_eur, demand_multiplier, category, "
                "name_translations, desc_translations "
                "FROM services WHERE is_active=true AND is_deleted=false"
            ))

        rows = result.fetchall()
    except Exception as e:
        rows = []

    if not rows or len(rows) < 110:
        # ── Static fallback: DB eksik (< 110 servis) veya boş → services.json kullan ─────
        # NOT: Seed sonrası DB 178 kayıt içeriyor, bu fallback artık devre dişi
        try:
            with open(_SERVICES_JSON, "r", encoding="utf-8-sig") as f:
                return json.load(f)
        except Exception:
            return []

    client_lang = get_language_from_request(request)

    response_data = []
    for row in rows:
        svc_id     = str(row[0])
        svc_tid    = str(row[1]) if row[1] else ""
        raw_name   = row[2] or ""
        base_price = float(row[4]) if row[4] else 0.0
        cur_price  = float(row[6]) if row[6] else base_price
        multiplier = float(row[9]) if row[9] else 1.0
        cat_id     = row[10] or ""
        
        name_trans = row[11] if len(row) > 11 and row[11] else {}
        desc_trans = row[12] if len(row) > 12 and row[12] else {}
        
        # O(1) Omni-Lingo Resolver
        display_name = name_trans.get(client_lang, raw_name)
        display_desc = desc_trans.get(client_lang, "")

        try:
            surge_data = await calculate_surge_price(db, svc_id, svc_tid)
            if surge_data:
                cur_price  = surge_data["current_price"]
                multiplier = surge_data["multiplier"]
        except Exception:
            pass

        main_category = _detect_category(raw_name)
        subcategory   = _detect_subcategory(raw_name, main_category)

        response_data.append({
            "id":                svc_id,
            "tenant_id":         svc_tid,
            "name":              display_name,
            "description":       display_desc,
            "duration_minutes":  row[3],
            "base_price":        base_price,
            "current_price_eur": cur_price,
            "currency":          row[5] or "EUR",
            "demand_multiplier": multiplier,
            "is_surging":        multiplier > 1.0,
            "categoryId":        subcategory,
            "category":          main_category,
            "price":             cur_price,
            "slug":              raw_name.lower().replace(" ", "-").replace("(", "").replace(")", ""),
        })

    return response_data

@router.get("-live")
async def get_services_dynamic():
    """
    [Phase B6: Dynamic Surge Pricing Engine]
    Automatically adjusts prices based on daily occupancy (bookings count).
    This transforms the static JSON response into a live, Yield-Optimized catalog.
    """
    services_path = _SERVICES_JSON
    if not services_path.exists():
         return {"error": "Services data not found"}
         
    with open(services_path, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
        
    async with AsyncSessionLocal() as db:
        from datetime import date
        today = date.today()
        
        # 1. Start Occupancy Scan
        stmt = select(func.count(Booking.id)).where(
            func.date(Booking.created_at) == today
        )
        result = await db.execute(stmt)
        daily_bookings = result.scalar() or 0
        
        # 2. Determine Surge Multiplier
        multiplier = 1.0
        if daily_bookings >= 10:
            multiplier = 1.35  # SCARCITY (+35%)
        elif daily_bookings >= 5:
            multiplier = 1.15  # SURGE (+15%)
        
        # 3. Persist multiplier globally so HQ Dashboard sees it instantly
        await db.execute(
            update(Service).values(demand_multiplier=multiplier)
        )
        await db.commit()
        
        # 4. Apply Multiplier to the Guest Zen Data Payload
        for s in data:
            if "price" in s and "amount" in s["price"]:
                base_price = s["price"]["amount"]
                # Apply multiplier and format to 2 decimal places or round up
                surged_price = math.ceil(base_price * multiplier)
                s["price"]["amount"] = surged_price
                s["price"]["original_amount"] = base_price  # Keep base price for reference
                s["price"]["is_surging"] = multiplier > 1.0
                
    print(f"SURGE ENGINE COMPUTED: Multiplier={multiplier}")
    return data


# --- INVENTORY & SCARCITY ENGINE (PHASE O) ---
from fastapi import Body, HTTPException
try:
    from server import neural_thought
except ImportError:
    async def neural_thought(msg, level="info"):
        pass

inventory_router = APIRouter()

@inventory_router.get("")
async def get_inventory(db: AsyncSession = Depends(get_db)):
    """Phase O – Full inventory list with scarcity status."""
    res = await db.execute(text("""
        SELECT si.id, si.service_id, s.name as service_name,
               si.item_name, si.unit, si.current_stock, si.min_threshold,
               si.is_luxury, si.notes, si.updated_at
        FROM service_inventory si
        LEFT JOIN services s ON s.id = si.service_id
        ORDER BY (si.current_stock - si.min_threshold) ASC
    """))
    rows = res.fetchall()
    items = []
    for r in rows:
        is_critical = r.current_stock <= r.min_threshold
        items.append({
            "id": r.id, "service_id": r.service_id, "service_name": r.service_name,
            "item_name": r.item_name, "unit": r.unit,
            "current_stock": r.current_stock, "min_threshold": r.min_threshold,
            "is_luxury": bool(r.is_luxury), "notes": r.notes,
            "is_critical": is_critical,
            "scarcity_bump": 0.25 if (is_critical and r.is_luxury) else (0.10 if is_critical else 0.0),
            "updated_at": str(r.updated_at)
        })
    return {"status": "success", "total": len(items), "critical": sum(1 for i in items if i["is_critical"]), "items": items}

@inventory_router.patch("/{item_id}")
async def update_inventory_stock(item_id: str, payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """Phase O – Update stock level for an inventory item."""
    res = await db.execute(text("SELECT * FROM service_inventory WHERE id = :id"), {"id": item_id})
    row = res.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    new_stock = payload.get("current_stock", row.current_stock)
    await db.execute(text("""
        UPDATE service_inventory
        SET current_stock = :stock, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    """), {"stock": new_stock, "id": item_id})
    await db.commit()

    is_critical = new_stock <= row.min_threshold
    bump = 0.25 if (is_critical and row.is_luxury) else (0.10 if is_critical else 0.0)

    if is_critical:
        cluster = "Aesthetic Elite" if row.is_luxury else "Recovery Athlete"
        await neural_thought(
            f"Santis Inventory ∷ '{row.item_name}' critical — {new_stock} {row.unit} left. "
            f"Scarcity +{bump:.0%} surge → {cluster} cluster targeted.",
            level="alert" if row.is_luxury else "surge"
        )
    else:
        await neural_thought(f"Santis Inventory ∷ '{row.item_name}' restocked → {new_stock} {row.unit}.", level="info")

    return {
        "status": "success",
        "item_id": item_id,
        "new_stock": new_stock,
        "scarcity_bump": bump
    }

# --- LEGACY JSON INTERCEPTORS & SWIPER FEEDER ---
from fastapi.responses import FileResponse
from app.core.config import settings

BASE_DIR = Path(__file__).resolve().parents[4]

legacy_proxy_router = APIRouter()

@legacy_proxy_router.get("/assets/data/services.json")
async def intercept_services_json(db: AsyncSession = Depends(get_db)):
    """
    Modernized Dynamic Services Interceptor. Reads directly from DB if available, 
    otherwise falls back to static JSON. Used for legacy proxying.
    """
    # For now, acting as a pass-through to not break the frontend format immediately, 
    # but could be fully DB-backed dynamically.
    services_path = BASE_DIR / "assets" / "data" / "services.json"
    if not services_path.exists():
         return {"error": "Services data not found"}
    return FileResponse(services_path, headers={"Cache-Control": "public, max-age=300", "X-Santis-Edge": "Intercepted-Index"})

@legacy_proxy_router.get("/assets/data/product-data.json")
async def intercept_products_json():
    # Similar mechanism for products catalog
    products_path = BASE_DIR / "assets" / "data" / "product-data.json"
    if not products_path.exists():
         return {"error": "Products data not found"}
    return FileResponse(products_path, headers={"Cache-Control": "public, max-age=300", "X-Santis-Edge": "Intercepted-Index"})

@router.get("/swiper-cards")
async def get_swiper_cards(db: AsyncSession = Depends(get_db)):
    """
    [Phase S] Apple-Style Swiper Feeder:
    Lightweight, lazy-load optimized Service Card Data generated directly from DB.
    """
    result = await db.execute(text("""
        SELECT id, name, duration_minutes, current_price_eur, category, demand_multiplier 
        FROM services WHERE is_active=true AND is_deleted=false LIMIT 20
    """))
    rows = result.fetchall()
    cards = []
    for r in rows:
        cards.append({
            "id": str(r.id),
            "name": r.name,
            "duration": f"{r.duration_minutes} min",
            "price": float(r.current_price_eur),
            "category": r.category,
            "surge": float(r.demand_multiplier) > 1.0,
            "image": f"/assets/img/services/{str(r.name).lower().replace(' ', '-')}.jpg" # Placeholder structural logic
        })
    return {"status": "success", "cards": cards}

