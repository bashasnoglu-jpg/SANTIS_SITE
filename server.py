import sys
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", module="google.generativeai")

# ── Production C+: Pre-import log suppression ────────────────────
# Must run BEFORE uvicorn/SQLAlchemy initialize their loggers.
import logging as _logging
for _noisy in ("sqlalchemy.engine", "sqlalchemy.engine.Engine",
               "sqlalchemy.pool", "sqlalchemy.orm", "httpx", "httpcore"):
    _logging.getLogger(_noisy).setLevel(_logging.WARNING)

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import json
import uvicorn

# 📌 1️⃣ Event Loop (Windows stabil - Python 3.16 uyarısı nedeniyle kaldırıldı)
# if sys.platform.startswith("win"):
#     asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

BASE_DIR = Path(__file__).resolve().parent

# ── Phase 14: Load .env for Gemini API Key ──────────────────────
import os
_env_path = BASE_DIR / ".env"
if _env_path.exists():
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ[_k.strip()] = _v.strip()  # Always overwrite — not setdefault

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Production C: Rotating Log Setup ────────────────────────
    from app.core.logging_config import setup_logging
    setup_logging()

    # ── Production D: DB Index Migration ────────────────────────
    from app.core.db_indexes import ensure_indexes
    _idx = ensure_indexes(BASE_DIR / "santis.db")
    print(f"[DBIndex] created={_idx['created']} skipped={_idx['skipped']} failed={len(_idx['failed'])}")

    print("--- SERVER STARTING NEW CODE v2 ---")
    for route in app.routes:
        methods = getattr(route, "methods", None)
        print(f"Route: {route.path} Methods: {methods}")

    from app.core.event_dispatcher import event_dispatcher
    from app.core.intelligence_worker import intelligence_worker
    from app.core.media_watchdog import start_media_watchdog, stop_media_watchdog

    event_dispatcher.start()
    intelligence_worker.start()
    start_media_watchdog()                              # Phase 27: Asset Watchdog
    asyncio.create_task(auto_pricing_worker())          # Phase J: Auto-Learning Pricing
    asyncio.create_task(nightly_intelligence_worker())  # Phase Q: Nightly Analytics at 02:00

    yield

    event_dispatcher.stop()
    intelligence_worker.stop()
    stop_media_watchdog()                               # Phase 27: Shutdown watchdog

# 📌 2️⃣ FastAPI Setup
app = FastAPI(title="Santis Club API", version="3.0", lifespan=lifespan)


# ── Production A: CORS Lockdown ─────────────────────────────────
# Never expose "*" in production. Only allow known origins.
ALLOWED_ORIGINS = [
    "http://localhost:5500",    # VS Code Live Server
    "http://127.0.0.1:5500",
    "http://localhost:8000",    # Uvicorn dev
    "http://127.0.0.1:8000",
    "http://localhost:3000",    # Optional: Next.js front
    os.getenv("PRODUCTION_ORIGIN", "https://santis.ai"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,    # No cookies needed — JWT in headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Tenant-ID", "X-Request-ID"],
)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.core.security_logger import security_logger
from fastapi.responses import JSONResponse
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from app.core.middleware import GlobalAuditMiddleware
app.add_middleware(GlobalAuditMiddleware)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Prevent Clickjacking
        response.headers["X-Frame-Options"] = "SAMEORIGIN"  # Allow admin Live Mirror iframe
        # Prevent MIME-Sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Strict HTTPS Enforce
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── Phase 19: Tenant Router Middleware ─────────────────────────
# Resolves tenant from subdomain (antalya.santis.ai → tenant_id)
# Sets request.state.tenant_id + request.state.tenant_slug
from app.core.tenant_router import TenantRouterMiddleware
app.add_middleware(TenantRouterMiddleware, db_path=str(BASE_DIR / "santis.db"))


# ── Production E: Global Unhandled Exception Handler ───────────
import traceback as _traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled 500s.
    Never leak tracebacks to the client — log them server-side.
    """
    tb = _traceback.format_exc()
    security_logger.error(
        f"[500] {request.method} {request.url} — {type(exc).__name__}: {exc}\n{tb}"
    )
    return JSONResponse(
        status_code=500,
        content={
            "error":   "Internal Server Error",
            "code":    500,
            "message": "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.",
        },
    )



# ═══════════════════════════════════════════════════════════════
# 📌 PHASE Q – NIGHTLY INTELLIGENCE ENGINE
# Her gece 02:00'de ağır hesaplamaları önbelleğe yazar.
# Gündüz dashboard'u terletmeden, hazır veriyi sunar.
# ═══════════════════════════════════════════════════════════════

async def cache_write(key: str, data: dict) -> None:
    """Phase Q – Write a pre-computed result to the analytics cache."""
    import json as _json
    async with AsyncSessionLocal() as db:
        await db.execute(text("""
            INSERT INTO pre_computed_metrics (metric_key, data_json, updated_at)
            VALUES (:k, :d, CURRENT_TIMESTAMP)
            ON CONFLICT(metric_key) DO UPDATE
                SET data_json = excluded.data_json,
                    updated_at = CURRENT_TIMESTAMP
        """), {"k": key, "d": _json.dumps(data)})
        await db.commit()


async def cache_read(key: str) -> dict | None:
    """Phase Q – Read a pre-computed result from the analytics cache."""
    import json as _json
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            text("SELECT data_json, updated_at FROM pre_computed_metrics WHERE metric_key = :k"),
            {"k": key}
        )
        row = res.fetchone()
        if row:
            return {"data": _json.loads(row[0]), "updated_at": str(row[1])}
    return None


async def nightly_intelligence_worker():
    """
    Phase Q – The Shadow Strategist.
    Waits until 02:00 every night, then runs all heavy analytics jobs.
    Writes results to pre_computed_metrics for fast dashboard reads.
    """
    from datetime import datetime as _dt, timedelta as _td
    import json as _json

    await asyncio.sleep(15)   # let server boot fully
    print("[Phase Q] Nightly Intelligence Engine: Online")

    while True:
        try:
            now = _dt.utcnow()
            # Calculate seconds until next 02:00 UTC
            target = now.replace(hour=2, minute=0, second=0, microsecond=0)
            if now >= target:
                target += _td(days=1)
            wait_secs = (target - now).total_seconds()
            print(f"[Phase Q] Next run at {target.strftime('%Y-%m-%d %H:%M')} UTC ({wait_secs/3600:.1f}h)")
            await asyncio.sleep(wait_secs)

            # ── JOB 1: DNA Cluster Summary ─────────────────────────
            print("[Phase Q] Job 1/3: DNA re-clustering...")
            async with AsyncSessionLocal() as db:
                from app.db.models.booking import Booking, BookingStatus
                from app.db.models.service import Service
                from app.db.models.customer import Customer
                from sqlalchemy import func as _func

                # Count by service category proxy (name keywords)
                res = await db.execute(
                    select(Service.name, _func.count(Booking.id).label("cnt"))
                    .join(Booking, Booking.service_id == Service.id)
                    .where(Booking.status == BookingStatus.CONFIRMED)
                    .group_by(Service.name)
                    .order_by(_func.count(Booking.id).desc())
                    .limit(20)
                )
                rows = res.fetchall()
                dna_map = {"THERMAL": 0, "AESTHETIC": 0, "RECOVERY": 0, "WELLNESS": 0}
                for name, cnt in rows:
                    n = (name or "").lower()
                    if any(w in n for w in ["hamam","thermal","salt","himalayan"]): dna_map["THERMAL"] += cnt
                    elif any(w in n for w in ["sothys","facial","skin","elixir"]):   dna_map["AESTHETIC"] += cnt
                    elif any(w in n for w in ["deep","tissue","recovery","sport"]):  dna_map["RECOVERY"] += cnt
                    else:                                                              dna_map["WELLNESS"] += cnt
                total = max(1, sum(dna_map.values()))
                dna_snapshot = {k: {"count": v, "pct": round(v/total*100, 1)} for k, v in dna_map.items()}
                await cache_write("nightly_dna_snapshot", dna_snapshot)
            print("[Phase Q] Job 1/3: DNA snapshot cached.")

            # ── JOB 2: LTV & Churn Refresh ─────────────────────────
            print("[Phase Q] Job 2/3: LTV / Churn refresh...")
            async with AsyncSessionLocal() as db:
                from app.db.models.customer import Customer
                from sqlalchemy import func as _func
                ltv_res = await db.execute(
                    select(
                        _func.count(Customer.id).label("total_guests"),
                        _func.avg(Customer.total_spent).label("avg_ltv"),
                        _func.max(Customer.total_spent).label("max_ltv"),
                        _func.sum(Customer.total_spent).label("total_revenue"),
                    )
                )
                row = ltv_res.fetchone()
                ltv_snapshot = {
                    "total_guests":  int(row[0] or 0),
                    "avg_ltv":       round(float(row[1] or 0), 2),
                    "max_ltv":       round(float(row[2] or 0), 2),
                    "total_revenue": round(float(row[3] or 0), 2),
                }
                await cache_write("nightly_ltv_snapshot", ltv_snapshot)
            print("[Phase Q] Job 2/3: LTV snapshot cached.")

            # ── JOB 3: Inventory Scarcity Forecast ─────────────────
            print("[Phase Q] Job 3/3: Scarcity forecast...")
            async with AsyncSessionLocal() as db:
                res = await db.execute(text("""
                    SELECT item_name, current_stock, min_threshold, is_luxury
                    FROM service_inventory ORDER BY current_stock ASC
                """))
                rows = res.fetchall()
                forecast = []
                for item_name, stock, thr, is_lux in rows:
                    risk = "CRITICAL" if stock <= thr else ("WARNING" if stock <= thr*2 else "OK")
                    forecast.append({
                        "item": item_name, "stock": stock,
                        "threshold": thr, "risk": risk,
                        "is_luxury": bool(is_lux)
                    })
                critical_count = sum(1 for f in forecast if f["risk"] == "CRITICAL")
                risk_level = "HIGH" if critical_count >= 3 else ("MEDIUM" if critical_count >= 1 else "LOW")
                await cache_write("nightly_scarcity_forecast", {
                    "items": forecast, "risk_level": risk_level,
                    "critical_count": critical_count
                })
            print("[Phase Q] Job 3/3: Scarcity forecast cached.")

            # ── Neural Stream: Sabah raporu ────────────────────────
            dna_dominant = max(dna_snapshot, key=lambda k: dna_snapshot[k]["count"])
            await neural_thought(
                f"Santis Nightly ∷ Analytics complete. "
                f"DNA dominant: {dna_dominant} ({dna_snapshot[dna_dominant]['pct']}%) | "
                f"Avg LTV: €{ltv_snapshot['avg_ltv']:,.0f} | "
                f"Scarcity risk next 7d: {risk_level}.",
                level="info"
            )
            print(f"[Phase Q] Nightly complete. DNA={dna_dominant}, LTV=€{ltv_snapshot['avg_ltv']:.0f}, Risk={risk_level}")

        except Exception as e:
            print(f"[Phase Q] Nightly error: {e}")
            await asyncio.sleep(3600)   # retry in 1h on failure


# Her worker burayı çağırarak NEURAL_THOUGHT eventi broadcast eder
# ═══════════════════════════════════════════════════════════════

async def neural_thought(message: str, level: str = "info"):
    """Broadcast a single AI thought to the HQ Neural Stream panel."""
    from datetime import datetime as _dt
    try:
        await manager.broadcast_to_room({
            "type":      "NEURAL_THOUGHT",
            "message":   message,
            "level":     level,   # info | surge | relax | alert
            "timestamp": _dt.utcnow().strftime("%H:%M:%S")
        }, "hq_global")
    except Exception:
        pass   # never block the caller


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE J – AUTO-LEARNING PRICING ENGINE
# Booking velocity → demand_multiplier otomatik güncelleme
# Her 15 dakikada çalışır, Uvicorn lifecycle'ına bağlıdır
# ═══════════════════════════════════════════════════════════════

SURGE_MIN      = 1.0   # Taban — asla altına inmez
SURGE_MAX      = 2.5   # Tavan — lüks kuralı
SURGE_STEP_UP  = 0.10  # Yoğunluk artınca çıkış adımı
SURGE_STEP_DOWN= 0.05  # Yoğunluk düşünca iniş adımı
VELOCITY_HIGH  = 8     # Son 2 saatte bu kadar üstü = "yoğun"
VELOCITY_LOW   = 2     # Bu kadar altı = "sakin"
INTERVAL_SEC   = 15 * 60  # 15 dakika

async def auto_pricing_worker():
    """
    Phase J – Auto-Learning Pricing Worker.
    Son 2 saatteki booking velocity'ye göre tüm servislerin
    demand_multiplier'ını otomatik ayarlar.
    """
    import asyncio
    from datetime import datetime, timedelta
    from sqlalchemy import func

    await asyncio.sleep(10)   # Uvicorn tam ayağa kalksın
    print("[Phase J] Auto-Pricing Engine: Online")

    while True:
        try:
            async with AsyncSessionLocal() as db:
                now      = datetime.utcnow()
                window   = now - timedelta(hours=2)

                # Son 2 saatteki onaylı booking sayısı
                res = await db.execute(
                    select(func.count(Booking.id))
                    .where(Booking.created_at >= window)
                    .where(Booking.status == BookingStatus.CONFIRMED)
                )
                velocity = int(res.scalar() or 0)

                # Mevcut ortalama multiplier
                cur_res = await db.execute(
                    select(func.avg(Service.demand_multiplier))
                )
                current_avg = float(cur_res.scalar() or 1.0)

                # Surge kararı
                if velocity >= VELOCITY_HIGH:
                    new_multiplier = min(SURGE_MAX, round(current_avg + SURGE_STEP_UP, 2))
                    direction = f"↑ SURGE ({velocity} bookings/2h)"
                elif velocity <= VELOCITY_LOW:
                    new_multiplier = max(SURGE_MIN, round(current_avg - SURGE_STEP_DOWN, 2))
                    direction = f"↓ RELAX ({velocity} bookings/2h)"
                else:
                    new_multiplier = current_avg
                    direction = f"= STABLE ({velocity} bookings/2h)"

                # ── Phase O: Scarcity Bump ─────────────────────────────
                scarcity_bumps = {}
                try:
                    scarcity_bumps = await get_scarcity_bumps(db)
                except Exception:
                    pass  # envanter tablosu yoksa devam et

                if scarcity_bumps:
                    # Global max scarcity bump (en yüksek kıtlık birimi belirler)
                    max_bump = max(v["bump"] for v in scarcity_bumps.values())
                    new_multiplier = min(SURGE_MAX, round(new_multiplier + max_bump, 2))
                    direction += f" +SCARCITY({max_bump:.0%})"
                    # Neural whisper for each critical item
                    for sid, info in scarcity_bumps.items():
                        await neural_thought(
                            f"Santis Inventory ∷ '{info['item']}' critical — "
                            f"{info['stock']} left (min {info['threshold']}). "
                            f"Applying +{info['bump']:.0%} Scarcity Bump.",
                            level="alert" if info["bump"] >= 0.25 else "surge"
                        )
                # ──────────────────────────────────────────────────────

                # Tüm aktif servisleri güncelle
                if abs(new_multiplier - current_avg) > 0.001:
                    await db.execute(
                        update(Service)
                        .where(Service.is_active == True)
                        .values(demand_multiplier=new_multiplier)
                    )
                    
                    # Phase 8: Strict Audit Log for Pricing changes
                    from app.services.audit import AuditService, AuditAction, AuditStatus
                    # Assuming a system execution since it's a worker (no actor_id)
                    await AuditService.log(
                        db=db,
                        action=AuditAction.SYSTEM,
                        entity_type="YieldEngine",
                        actor_id=None,
                        details={
                            "event": "auto_pricing_update",
                            "old_multiplier": current_avg,
                            "new_multiplier": new_multiplier,
                            "velocity": velocity,
                            "trigger": direction
                        },
                        status=AuditStatus.SUCCESS
                    )
                    
                    await db.commit()

                    # Phase N: Neural Thought — fiyat kararını stream'e yaz
                    await neural_thought(
                        f"Phase J ↔ {now.strftime('%H:%M')} | Velocity: {velocity} bookings/2h | "
                        f"Multiplier {current_avg:.2f} → {new_multiplier:.2f} | {direction}",
                        level="surge" if velocity >= VELOCITY_HIGH else "relax"
                    )

                    # Broadcast to HQ Dashboard
                    try:
                        await manager.broadcast_to_room({
                            "type":        "SURGE_UPDATED",
                            "multiplier":  new_multiplier,
                            "velocity":    velocity,
                            "direction":   direction,
                            "scarcity":    bool(scarcity_bumps),
                            "timestamp":   now.isoformat()
                        }, "hq_global")
                    except Exception:
                        pass

                print(f"[Phase J] {now.strftime('%H:%M')} | {direction} | multiplier: {current_avg:.2f} → {new_multiplier:.2f}")

        except Exception as e:
            print(f"[Phase J] Worker error: {e}")

        await asyncio.sleep(INTERVAL_SEC)


# --- SANTIS DYNAMIC SERVICES ENGINE ---
from sqlalchemy import func
import json
from app.db.models.booking import Booking, BookingStatus
from app.db.session import AsyncSessionLocal
from sqlalchemy import select, update, desc, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.db.session import get_db
from app.db.models.customer import Customer
import math
from app.db.models.service import Service

@app.get("/api/v1/services-live")
async def get_services_dynamic():
    """
    [Phase B6: Dynamic Surge Pricing Engine]
    Automatically adjusts prices based on daily occupancy (bookings count).
    This transforms the static JSON response into a live, Yield-Optimized catalog.
    """
    services_path = BASE_DIR / "assets" / "data" / "services.json"
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
                
    print(f"SURGE ENGINE COMPUTED: Multiplier={multiplier} | Example [1] Base={data[1]['price'].get('original_amount')} Surged={data[1]['price']['amount']}")
    return data
    
from app.api.v1.endpoints import (
    users,
    auth,
    tenants,
    bookings,
    payments,
    revenue,
    services,
    crm,
    admin,
    admin_tools,
    content,
    graph,
    events,
    pricing,
    content_publish,
    edge_resolver,
    seo,
    gallery,
    predictive,
    personalize,
    analytics,
    agent_logic,
    sdk,
    billing
)

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["auth"],
)
app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["users"],
)
app.include_router(
    tenants.router,
    prefix="/api/v1/tenants",
    tags=["tenants"],
)
app.include_router(
    bookings.router,
    prefix="/api/v1/bookings",
    tags=["bookings"],
)

app.include_router(
    payments.router,
    prefix="/api/v1/payments",
    tags=["payments_gate_of_capital"],
)

app.include_router(
    revenue.router,
    prefix="/api/v1/revenue",
    tags=["revenue"],
)
app.include_router(
    billing.router,
    prefix="/api/v1/billing",
    tags=["billing_sovereign_pay"],
)
app.include_router(
    services.router,
    prefix="/api/v1/services",
    tags=["services_live_pricing"],
)
app.include_router(
    crm.router,
    prefix="/api/v1/crm",
    tags=["crm_ghost_trace"]
)

app.include_router(
    admin.router,
    tags=["admin"],
)
app.include_router(
    admin_tools.router,
    tags=["admin_tools"]
)

app.include_router(
    content.router,
    tags=["content"],
)
app.include_router(
    graph.router,
    prefix="/api/v1/graph",
    tags=["graph_ai"]
)
app.include_router(
    events.router,
    prefix="/api/v1/events",
    tags=["events_ai"]
)
app.include_router(
    pricing.router,
    prefix="/api/v1/pricing",
    tags=["yield_autopilot"]
)
app.include_router(
    content_publish.router,
    prefix="/api/v1",
    tags=["Atomic Content"],
)
app.include_router(
    edge_resolver.router,
    prefix="/api/v1",
    tags=["Edge Resolver"],
)
app.include_router(
    seo.router,
)
app.include_router(
    gallery.router,
    prefix="/api/v1/gallery",
    tags=["gallery"]
)
app.include_router(
    agent_logic.router,
    prefix="/api/v1/ai",
    tags=["agentic_closing"]
)

# Gallery routes handled directly in server.py (lines 1944-2190)
# app.include_router(
#     gallery.router,
#     prefix="/api/v1/gallery",
#     tags=["Gallery Command"]
# )

app.include_router(
    predictive.router,
    prefix="/api/v1/predictive",
    tags=["Phase S - Predictive Offers"]
)

app.include_router(
    personalize.router,
    prefix="/api/v1/personalize",
    tags=["Phase 30 - Chameleon API"]
)

app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["HQ Pulse Analytics"]
)

app.include_router(
    bookings.router,
    prefix="/api/v1/bookings",
    tags=["Bookings (Public/Guest)"]
)

# ── Phase 33: Agentic Sovereign Hand-Off AI ──────────────
app.include_router(
    agent_logic.router,
    prefix="/api/v1/ai",
    tags=["Agentic AI - Closing"]
)

# ── Phase 39: The Global SaaS Onboarding (Hospitality OS) ─
app.include_router(
    sdk.router,
    prefix="/api/v1/sdk",
    tags=["Sovereign SDK Gateway"]
)

import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("GLOBAL ERROR HANDLER CAUGHT EXCEPTION")
    traceback.print_exc()
    print(f"Error: {exc}")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc), "trace": traceback.format_exc()},
    )

# 📌 3️⃣ CORS (Production-safe basic)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # production’da domain ile sınırla
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📌 4️⃣ Static Mount
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")
app.mount("/components", StaticFiles(directory=BASE_DIR / "components"), name="components")
# Admin arayüz dosyalarını /admin yolundan servis et
app.mount("/admin", StaticFiles(directory=BASE_DIR / "admin", html=True), name="admin")

# 📌 4.1️⃣ SANTIS V17 - NEURAL BRIDGE (ROOM ENGINE)
from typing import List, Dict
from app.core.websocket import ConnectionManager, manager


@app.websocket("/ws")
async def websocket_bridge(websocket: WebSocket, client_type: str = "guest", client_id: str = "guest_1"):
    # client_type = 'hq' veya 'tenant'. client_id = 'global' veya '2' (tenant id) vb.
    room_id = f"{client_type}_{client_id}"
    
    await manager.connect(websocket, room_id)
    try:
        # Welcome message (Handshake init)
        await websocket.send_text(json.dumps({"type": "welcome", "source": "server", "message": f"Connected to Neural Bridge as {room_id}"}))
        
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except Exception:
                payload = {"type": "raw_message", "text": data}

            payload["sender_room"] = room_id
            payload["sender_type"] = client_type
            
            # --- THE PING-PONG ROUTING ---
            
            # 1) HQ'dan bir Tenant'a özel komut gidiyorsa (Ping)
            if payload.get("type") == "hq_ping" and payload.get("target_tenant"):
                target_room = f"tenant_{payload['target_tenant']}"
                await manager.broadcast_to_room(payload, target_room)
                
            # 2) Tenant komutu uygulayıp HQ'ya yanıt dönüyorsa (Pong / Acknowledged)
            elif payload.get("type") in ["tenant_pong", "tenant_sync"]:
                # Bütün HQ panellerine atalım
                await manager.broadcast_to_room(payload, "hq_global")
                
            # 3) Guest Zen panelinden anlık ciro fırlaması (Surge) geliyorsa HQ'ya gönder
            elif payload.get("type") == "REVENUE_SURGE":
                await manager.broadcast_to_room(payload, "hq_global")
                
            # 4) Herkese giden genel broadcast
            else:
                 await manager.broadcast_global(payload)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        print(f"[WS] Exception in {room_id}: {e}")
        manager.disconnect(websocket, room_id)   # always clean up stale socket
        try:
            await websocket.close()
        except Exception:
            pass

# WebSocket: Zekayı Dashboard'a bağlayan sinir ucu
@app.websocket("/ws/pulse")
async def pulse_stream(websocket: WebSocket):
    await manager.connect(websocket, "hq_global")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "hq_global")
# 📌 5️⃣ API Route & Legacy Data Interceptors
from sqlalchemy import select
from app.db.models.content import ContentRegistry
import os

@app.get("/assets/data/services.json")
async def intercept_services_json():
    """
    [Phase B5: API Gateway Proxy] 
    Intercepts the legacy frontend fetch for services.json.
    Dynamically builds the V5.5 payload from the Atomic Publish registry blobstorage.
    To avoid 150 file reads on every load, we fetch the `services.json` baseline if it exists
    or proxy it. Actually, for optimal speed, if we want to completely deprecate the static file,
    we'd query DB and assemble. For now, since `service-detail-loader.js` hits O(1) Edge directly,
    we just return the static file here as an index layer, but with Cache-Control headers.
    """
    services_path = BASE_DIR / "assets" / "data" / "services.json"
    if not services_path.exists():
         return {"error": "Services data not found"}
    return FileResponse(services_path, headers={"Cache-Control": "public, max-age=300", "X-Santis-Edge": "Intercepted-Index"})

@app.get("/assets/data/product-data.json")
async def intercept_products_json():
    products_path = BASE_DIR / "assets" / "data" / "product-data.json"
    if not products_path.exists():
         return {"error": "Products data not found"}
    return FileResponse(products_path, headers={"Cache-Control": "public, max-age=300", "X-Santis-Edge": "Intercepted-Index"})



# 📌 5.5️⃣ Missing API Endpoints (Stubbed/Mocked)
from fastapi import UploadFile, File, Form, Body
import random

@app.get("/api/pages/{slug}")
async def get_page_data(slug: str):
    # Try to load from assets/data/{slug}_data.json
    data_path = BASE_DIR / "assets" / "data" / f"{slug}_data.json"
    if data_path.exists():
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    # Default structure for page builder
    return {"title": slug.title(), "blocks": []}

@app.post("/api/pages/{slug}")
async def save_page_data(slug: str, payload: dict = Body(...)):
    # Mock save
    print(f"Mock saving page {slug}: {payload.keys()}")
    return {"status": "success", "message": "Page saved (mock)"}

@app.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...)):
    # Mock upload
    return {"filename": f"mock_{file.filename}", "url": f"/uploads/mock_{file.filename}"}

@app.post("/admin/generate-ai")
async def generate_ai(payload: dict = Body(...)):
    # Mock AI generation
    return {"text": "This is AI generated content placeholder for " + payload.get("prompt", "")}

@app.get("/api/health-score")
async def get_health_score():
    return {"score": 98}

@app.get("/api/health-history")
async def get_health_history():
    return {
        "scores": [92, 94, 95, 98],
        "reports": ["report_1.html", "report_2.html"]
    }

@app.get("/api/config")
async def get_config():
    return {"animation_level": "high", "env": "dev"}

from pydantic import BaseModel
class ReservationPayload(BaseModel):
    tenant_id: int
    hotel_id: int
    room_number: str
    service_name: str
    price: float

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

@app.post("/api/v1/reservation")
async def create_reservation(payload: ReservationPayload, db: AsyncSession = Depends(get_db)):
    # 1. Prototype Mapping: Find first available tenant, customer, service, etc.
    tenant_res = await db.execute(select(Tenant).limit(1))
    t1 = tenant_res.scalar_one_or_none()
    
    cust_res = await db.execute(select(Customer).where(Customer.tenant_id == t1.id).limit(1))
    c1 = cust_res.scalar_one_or_none()
    
    # Check if a custom service exists or create mock
    from app.db.models.service import Service
    from app.db.models.room import Room
    from app.db.models.staff import Staff
    from app.db.models.booking import BookingStatus
    from datetime import datetime
    
    svc_res = await db.execute(select(Service).where(Service.name.ilike(f"%{payload.service_name}%")).limit(1))
    svc = svc_res.scalar_one_or_none()
    
    if not svc:
        svc_res = await db.execute(select(Service).limit(1))
        svc = svc_res.scalar_one_or_none()
        
    room_res = await db.execute(select(Room).limit(1))
    r1 = room_res.scalar_one_or_none()
    
    staff_res = await db.execute(select(Staff).limit(1))
    st1 = staff_res.scalar_one_or_none()
    
    # 2. Insert Booking
    if t1 and c1 and svc:
        new_booking = Booking(
            tenant_id=t1.id,
            customer_id=c1.id,
            service_id=svc.id,
            room_id=r1.id if r1 else None,
            staff_id=st1.id if st1 else None,
            start_time=datetime.utcnow() + timedelta(hours=1),
            end_time=datetime.utcnow() + timedelta(hours=2),
            price_snapshot=payload.price,
            status=BookingStatus.PENDING
        )
        db.add(new_booking)
        
        # 3. Update Daily Revenue for Today
        from app.db.models.revenue import DailyRevenue
        from datetime import date
        today = date.today()
        rev_res = await db.execute(
            select(DailyRevenue)
            .where(DailyRevenue.tenant_id == t1.id, DailyRevenue.date == today)
        )
        dr = rev_res.scalar_one_or_none()
        if dr:
            dr.daily_revenue = float(dr.daily_revenue) + payload.price
            dr.booking_count = dr.booking_count + 1
        else:
            dr = DailyRevenue(tenant_id=t1.id, date=today, daily_revenue=payload.price, booking_count=1)
            db.add(dr)
            
        await db.commit()
    
    # 📌 SANTIS V17 - NEURAL BRIDGE: LIVE FEED STREAM (GUEST_ACTION_SYNC)
    # Trigger HQ Dashboard with the new booking event
    try:
        from datetime import datetime
        # Fetch customer name for the sync payload
        guest_name_sync = "Walk-in Guest"
        if c1:
            guest_name_sync = c1.full_name
        
        live_feed_payload = {
            "type": "GUEST_ACTION_SYNC",
            "action": "New Booking",
            "guest_name": guest_name_sync,
            "room": f"Room {payload.room_number}",
            "hotel": t1.name if t1 else "Unknown Node",
            "service": svc.name if svc else payload.service_name,
            "price": payload.price,
            "tenant_id": payload.tenant_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_global(live_feed_payload)
        print(f"[Neural Bridge] GUEST_ACTION_SYNC dispatched: {guest_name_sync} → {live_feed_payload['service']}")
    except Exception as e:
        print(f"Failed to stream to HQ: {e}")

    return {"status": "success", "message": "Reservation confirmed in Master OS"}

from app.db.models.customer import Customer
@app.get("/api/v1/admin/ai-insights")
async def get_admin_ai_insights(db: AsyncSession = Depends(get_db)):
    # Gather network-wide basic stats
    total_rev_res = await db.execute(select(func.sum(DailyRevenue.daily_revenue)))
    total_rev = float(total_rev_res.scalar() or 0.0)
    
    total_customers_res = await db.execute(select(func.count(Customer.id)))
    total_customers = total_customers_res.scalar() or 0
    
    booking_cnt_res = await db.execute(select(func.count(Booking.id)))
    total_bookings = booking_cnt_res.scalar() or 0
    
    # Get recent 10 bookings to analyze trends
    recent_bookings_res = await db.execute(select(Booking).order_by(desc(Booking.created_at)).limit(10))
    recent_bookings = recent_bookings_res.scalars().all()
    trend_data = [float(b.price_snapshot) for b in recent_bookings if b.price_snapshot]
    aov = sum(trend_data) / len(trend_data) if trend_data else 0
    recent_sales_str = ", ".join([f"€{p:,.0f}" for p in trend_data])

    # Generate Insight with Gemini
    ai_insight_text = "Analyzing global network financial data..."
    staffing_prediction = "Awaiting orbital intelligence scan..."
    latency_ms = 0.0
    
    try:
        from dotenv import load_dotenv
        import os
        import time
        load_dotenv(override=True)
        current_api_key = os.getenv("GEMINI_API_KEY")
        if current_api_key:
            import google.generativeai as genai
            genai.configure(api_key=current_api_key)
            model = genai.GenerativeModel("gemini-2.5-flash") # V17 Optimizasyonu: Hızlı yanıt için flash
            
            prompt = f"""Sen Santis Master OS'un en üst düzey Finansal Stratejisti ve Sanal Genel Müdürüsün. 
            Aşağıdaki Headquarters (HQ) verilerine bakarak yönetime stratejik tahmin ve personel/kaynak planlaması sun:
            - Sistemdeki Toplam Kayıtlı Misafir: {total_customers}
            - Gerçekleşen Toplam Rezervasyon Adedi: {total_bookings}
            - Bugüne Kadarki Toplam Ağ Geliri: €{total_rev:,.0f}
            - Son 10 Rezervasyon Sepet Tutarları: [{recent_sales_str}]
            - Ortalama Sepet Tutarı (AOV): €{aov:,.0f}
            
            Görev:
            Sadece JSON formatında yanıt dön. Asla fazladan metin, selamlama veya markdown block (```json) ekleme. Saf parse edilebilir JSON ver:
            {{
               "insight": "AOV €{aov:,.0f} bandında güçlü ilerliyor. Akşam 'Premium Paketleri' PUSH ederseniz gün sonu hedefine ulaşılır.",
               "staffing_prediction": "Bu yoğunlukta yarın sabah vardiyasına 2 ekstra masöz ve 1 karşılama personeli eklenmesi elzemdir."
            }}
            Tonlama "Quiet Luxury", kendinden emin ve sayılarla konuşan bir lider. Uzun paragraflar yazma.
            """
            
            import asyncio
            start_time = time.perf_counter()
            response = await asyncio.to_thread(model.generate_content, prompt)
            latency_ms = (time.perf_counter() - start_time) * 1000
            
            if response and response.text:
                 text_clean = response.text.replace("```json", "").replace("```", "").strip()
                 import json as pyljson
                 try:
                     ai_data = pyljson.loads(text_clean)
                     ai_insight_text = ai_data.get("insight", ai_insight_text)
                     staffing_prediction = ai_data.get("staffing_prediction", staffing_prediction)
                 except pyljson.JSONDecodeError:
                     # Fallback string manipulation if JSON is malformed
                     pass

    except Exception as e:
        print(f"Gemini AI Insight Error: {e}")
        ai_insight_text = f"Master OS YZ Ağına bağlantı kurulamadı. Lütfen network durumunu kontrol edin."
        
    return {
        "status": "success",
        "metrics": {
            "total_revenue": total_rev,
            "total_customers": total_customers,
            "total_bookings": total_bookings
        },
        "ai_insight": ai_insight_text,
        "staffing_prediction": staffing_prediction,
        "neural_latency_ms": latency_ms
    }

from datetime import timedelta
@app.get("/api/v1/admin/bookings")
async def get_admin_bookings(db: AsyncSession = Depends(get_db)):
    # Get last 20 bookings globally
    booking_res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.room), selectinload(Booking.tenant), selectinload(Booking.customer))
        .order_by(desc(Booking.created_at))
        .limit(20)
    )
    bookings = booking_res.scalars().all()
    
    result = []
    for b in bookings:
        result.append({
            "ref_id": f"BK-{str(b.id)[:8].upper()}",
            "time_ago": b.created_at.strftime("%H:%M") if b.created_at else "Now",
            "tenant_name": b.tenant.name if b.tenant else "Unknown App",
            "guest_info": b.customer.full_name if b.customer else "Walk-in Proxy",
            "service_name": b.service.name if b.service else "Custom",
            "price": float(b.price_snapshot),
            "status": b.status.value
        })
    return {"status": "success", "bookings": result}

from sqlalchemy import select, func, desc
from datetime import date, timedelta
from app.db.models.revenue import DailyRevenue
from app.db.models.booking import Booking

@app.get("/api/v1/admin/revenue")
async def get_admin_revenue(period: str = "today", db: AsyncSession = Depends(get_db)):
    today = date.today()
    if period == "today":
        start_date = today
    elif period == "week":
        start_date = today - timedelta(days=7)
    elif period == "month":
        start_date = today - timedelta(days=30)
    else:
        start_date = today

    # Aggregate Revenue
    gross_res = await db.execute(
        select(func.sum(DailyRevenue.daily_revenue))
        .where(DailyRevenue.date >= start_date)
    )
    gbv = float(gross_res.scalar() or 0.0)
    net_revenue = gbv * 0.20 # Assume 20% platform cut

    # AOV based on Bookings table for the period
    aov_res = await db.execute(
        select(func.avg(Booking.price_snapshot))
        .where(func.date(Booking.created_at) >= start_date)
    )
    raw_aov = float(aov_res.scalar() or 0.0)
    aov = raw_aov if raw_aov else 126.0

    return {
        "status": "success",
        "data": {
            "gbv": f"€{gbv:,.0f}",
            "net": f"€{net_revenue:,.0f}",
            "aov": f"€{aov:,.0f}",
            "top_service": "Deep Tissue Massage <br/><span class='text-sm text-gray-400 font-normal'>Trending</span>"
        }
    }

from app.db.models.tenant import Tenant
from app.db.models.customer import Customer
from sqlalchemy.orm import selectinload

@app.get("/api/v1/admin/hotels")
async def get_admin_hotels(db: AsyncSession = Depends(get_db)):
    # Fetch all tenants
    tenants_res = await db.execute(select(Tenant))
    tenants = tenants_res.scalars().all()
    
    result = []
    today = date.today()
    
    for t in tenants:
        # Get Rev for tenant today
        rev_res = await db.execute(
            select(func.sum(DailyRevenue.daily_revenue))
            .where(DailyRevenue.tenant_id == t.id)
            .where(DailyRevenue.date == today)
        )
        today_rev = float(rev_res.scalar() or 0.0)
        
        # Get Customers for tenant
        cust_res = await db.execute(
            select(func.count(Customer.id))
            .where(Customer.tenant_id == t.id)
        )
        total_cust = cust_res.scalar() or 0
        
        # Fake AI Conv for now based on string representation of id
        ai_conv_seed = int(str(t.id)[:8], 16)
        ai_conv = max(10, (ai_conv_seed * 7) % 35)
        
        status = "Online" if t.is_active else "Offline"
        
        result.append({
            "id": t.id,
            "name": t.name,
            "location": f"{getattr(t, 'city', 'Antalya')}, {t.country if hasattr(t, 'country') else 'TR'}",
            "status": status,
            "guests": total_cust,
            "revenue": today_rev,
            "ai_conv": f"{ai_conv}%"
        })
        
    return {"status": "success", "hotels": result}

from pydantic import BaseModel

class TenantCreate(BaseModel):
    name: str
    city: str
    slug: str
    spa_rooms: int = 10
    hotel_type: str = "luxury"
    share_pct: int = 20

@app.post("/api/v1/admin/hotels")
async def create_admin_hotel(payload: TenantCreate, db: AsyncSession = Depends(get_db)):
    try:
        new_tenant = Tenant(
            name=payload.name,
            # Fallback for country since UI doesn't send it, default to TR.
            is_active=True
        )
        if hasattr(Tenant, 'city'):
            setattr(new_tenant, 'city', payload.city)
        if hasattr(Tenant, 'country'):
            setattr(new_tenant, 'country', "TR")
            
        db.add(new_tenant)
        await db.commit()
        await db.refresh(new_tenant)
        
        return {"status": "success", "message": "Tenant deployed successfully", "tenant_id": new_tenant.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/hq/live-command/{id}")
async def hq_live_command(id: str, payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    command = payload.get("command")
    
    if id == "demo_wick":
        tenant_id = 1
        guest_name = "John Wick"
    else:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.customer))
            .where(Booking.id == id)
        )
        res = await db.execute(stmt)
        booking = res.scalar_one_or_none()
        
        tenant_id = booking.tenant_id if booking else 2
        guest_name = booking.customer.full_name if booking and booking.customer else "Unknown Target"
    
    print(f"Executing Live Command {command} on ID {id} for Tenant {tenant_id} (Guest: {guest_name})")
    
    # 📌 MATRIX VISION LOGIC: Determine Theme and Voice Profile
    theme = "standard"
    tts_message = f"Priority Override. Executing {command} for guest {guest_name}."
    
    if "John Wick" in guest_name:
        theme = "red-alert"
        if command == "UPSELL_DISCOUNT":
            tts_message = "Tactical Override Authorized. Apply absolute privacy discount for Mr. Wick. Do not make eye contact."
        else:
            tts_message = f"High Risk Target. Executing {command} for John Wick. Prepare the tactical spa protocol."
            
    elif "Thomas Anderson" in guest_name or "Neo" in guest_name:
        theme = "matrix-blue"
        if command == "UPSELL_DISCOUNT":
            tts_message = "Incoming transmission for Mr. Anderson. Apply the sensory deprivation discount to initiate disconnection."
        else:
            tts_message = f"Signal intercepted. Executing {command} for Mr. Anderson. Follow the white rabbit protocol."
    
    # Broadcast to Tenant via Server's ConnectionManager
    await manager.broadcast_to_room({
        "type": "hq_command",
        "command": command,
        "guest_id": str(id),
        "guest_name": guest_name,
        "source": "Master OS",
        "theme": theme,
        "tts_message": tts_message
    }, f"tenant_{tenant_id}")
        
    return {
        "status": "success", 
        "command_executed": command, 
        "target_id": id, 
        "tenant": str(tenant_id),
        "theme_dispatched": theme
    }

@app.post("/hq/activate-protocol/{protocol_name}")
async def hq_activate_protocol(protocol_name: str, payload: dict = Body(None), db: AsyncSession = Depends(get_db)):
    """
    Operation: Baba Yaga (Live Action Protocol) Trigger.
    Broadcasts a global red-alert to transition UI into Master Mode.
    """
    target_name = payload.get("target", "John Wick") if payload else "John Wick"
    
    if protocol_name == "baba_yaga":
        print(f"🔥 MASTER ALARM: Baba Yaga protocol triggered for {target_name}!")
        await manager.broadcast_global({
            "type": "MATRIX_RED_ALERT",
            "target": target_name,
            "message": f"Priority Override: {target_name} detected in the network."
        })
        return {"status": "success", "message": "Baba Yaga protocol dispatched instantly to all edge nodes."}
        
    return {"status": "error", "message": "Unknown protocol."}

@app.post("/hq/deactivate-protocol/{protocol_name}")
async def hq_deactivate_protocol(protocol_name: str, db: AsyncSession = Depends(get_db)):
    """
    Operation: Peace Protocol.
    Broadcasts a global stand-down signal to revert UI back to Zen Mode.
    """
    if protocol_name == "baba_yaga":
        print(f"🕊️ MASTER ALARM: Baba Yaga protocol deactivated. Standing down.")
        await manager.broadcast_global({
            "type": "MATRIX_STAND_DOWN",
            "message": "Protocol deactivated. Resuming standard operations."
        })
        return {"status": "success", "message": "Peace protocol dispatched instantly to all edge nodes."}
        
    return {"status": "error", "message": "Unknown protocol."}


from app.db.models.room import Room

# 📌 PHASE 3: SHADOW RITUALS CATALOG
@app.get("/api/v1/shadow-rituals")
async def get_shadow_rituals():
    """
    Shadow Rituals Catalog – Only accessible in Baba Yaga / Tactical Override mode.
    Returns the classified service list from shadow_rituals.json.
    """
    shadow_path = BASE_DIR / "assets" / "data" / "shadow_rituals.json"
    if not shadow_path.exists():
        raise HTTPException(status_code=404, detail="Shadow catalog not found.")
    with open(shadow_path, "r", encoding="utf-8") as f:
        return json.load(f)

# ═══════════════════════════════════════════════════════════════
# 📌 PHASE G – VIP PROFILING ENGINE (Sentient Guest Intelligence)
# ═══════════════════════════════════════════════════════════════

class ProfileRequest(BaseModel):
    customer_id: str  # UUID string

@app.post("/api/v1/guest/generate-profile")
async def generate_vip_profile(payload: ProfileRequest, db: AsyncSession = Depends(get_db)):
    """
    Generates a Gemini AI persona summary + VIP score for a customer.
    Updates ai_persona_summary, visit_count, total_spent in DB.
    """
    import uuid as _uuid
    try:
        cust_id = _uuid.UUID(payload.customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer_id UUID.")

    # 1. Fetch customer + booking history
    cust_res = await db.execute(
        select(Customer)
        .options(selectinload(Customer.bookings))
        .where(Customer.id == cust_id)
    )
    customer = cust_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    bookings = customer.bookings or []
    total_spent = sum(float(b.price_snapshot or 0) for b in bookings)
    visit_count = len(bookings)

    # 2. Extract service names from bookings
    service_names = []
    for b in bookings[-10:]:  # son 10 booking
        if b.service_id:
            svc_res = await db.execute(select(Service).where(Service.id == b.service_id))
            svc = svc_res.scalar_one_or_none()
            if svc:
                service_names.append(svc.name)

    services_str = ", ".join(service_names) if service_names else "No service history"

    # 3. Calculate VIP Score (0-100)
    vip_score = min(100, int(
        (min(visit_count, 20) / 20 * 40) +   # 40 pts: visit frequency
        (min(total_spent, 5000) / 5000 * 40) + # 40 pts: total spend
        (20 if total_spent > 1000 else 0)       # 20 pts: high-value bonus
    ))

    vip_tier = "STANDARD"
    if vip_score >= 80: vip_tier = "CONTINENTAL"
    elif vip_score >= 60: vip_tier = "PLATINUM"
    elif vip_score >= 40: vip_tier = "GOLD"

    # 4. Generate AI Persona with Gemini
    persona_text = f"Loyal guest with {visit_count} visits. Total spend: €{total_spent:,.0f}."
    try:
        from dotenv import load_dotenv
        import os, asyncio
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""Sen Santis Master OS'un VIP Guest Intelligence motorusun.
Aşağıdaki misafir verisine bakarak 2-3 cümlelik, "Quiet Luxury" tonunda, stratejik bir persona özeti yaz.
İngilizce olsun. Asla selamlama veya blok açıklama ekleme. Direkt içgörüyle başla.

Misafir: {customer.full_name}
Ziyaret Sayısı: {visit_count}
Toplam Harcama: €{total_spent:,.0f}
En Çok Seçilen Servisler: {services_str}
VIP Tier: {vip_tier} (Skor: {vip_score}/100)
"""
            response = await asyncio.to_thread(model.generate_content, prompt)
            if response and response.text:
                persona_text = response.text.strip()
    except Exception as e:
        print(f"[Phase G] Gemini persona error: {e}")

    # 5. Persist to DB
    customer.ai_persona_summary = persona_text
    customer.visit_count = visit_count
    customer.total_spent = total_spent
    from datetime import datetime
    customer.last_visit = datetime.utcnow()
    await db.commit()

    # 6. Broadcast to HQ Neural Bridge
    await manager.broadcast_global({
        "type": "VIP_PROFILE_UPDATED",
        "customer_id": str(customer.id),
        "guest_name": customer.full_name,
        "vip_score": vip_score,
        "vip_tier": vip_tier,
        "persona": persona_text,
        "visit_count": visit_count,
        "total_spent": total_spent
    })

    return {
        "status": "success",
        "customer_id": str(customer.id),
        "guest_name": customer.full_name,
        "vip_score": vip_score,
        "vip_tier": vip_tier,
        "visit_count": visit_count,
        "total_spent": total_spent,
        "persona": persona_text
    }


@app.get("/api/v1/admin/vip-roster")
async def get_vip_roster(db: AsyncSession = Depends(get_db)):
    """
    Returns all customers with their VIP scores for the Sentient Guest Card panel.
    Computes scores live from booking data.
    """
    cust_res = await db.execute(
        select(Customer)
        .options(selectinload(Customer.bookings))
        .order_by(Customer.total_spent.desc())
        .limit(20)
    )
    customers = cust_res.scalars().all()

    roster = []
    for c in customers:
        bookings = c.bookings or []
        total = float(c.total_spent or 0)
        visits = int(c.visit_count or len(bookings))

        vip_score = min(100, int(
            (min(visits, 20) / 20 * 40) +
            (min(total, 5000) / 5000 * 40) +
            (20 if total > 1000 else 0)
        ))
        vip_tier = "STANDARD"
        if vip_score >= 80: vip_tier = "CONTINENTAL"
        elif vip_score >= 60: vip_tier = "PLATINUM"
        elif vip_score >= 40: vip_tier = "GOLD"

        roster.append({
            "id": str(c.id),
            "name": c.full_name,
            "vip_score": vip_score,
            "vip_tier": vip_tier,
            "visit_count": visits,
            "total_spent": total,
            "last_visit": c.last_visit.strftime("%Y-%m-%d") if c.last_visit else "—",
            "persona": c.ai_persona_summary or None
        })

    return {"status": "success", "count": len(roster), "roster": roster}


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE H – REVENUE INTELLIGENCE DASHBOARD ("The Money Engine")
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/revenue/forecast")
async def get_revenue_forecast(db: AsyncSession = Depends(get_db)):
    """
    Yield Forecast Engine:
    - Gerçek booking verisinden günlük/haftalık/aylık gelir özeti
    - Surge multiplier'dan AI tahmini
    - Basit backtesting accuracy skoru
    """
    from datetime import datetime, timedelta
    from sqlalchemy import func

    now = datetime.utcnow()
    day_start   = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start  = day_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0)

    # — Gerçek Gelir Sorguları —
    async def sum_bookings(since: datetime) -> float:
        res = await db.execute(
            select(func.sum(Booking.price_snapshot))
            .where(Booking.created_at >= since)
            .where(Booking.status == BookingStatus.CONFIRMED)
        )
        return float(res.scalar() or 0)

    today_rev   = await sum_bookings(day_start)
    week_rev    = await sum_bookings(week_start)
    month_rev   = await sum_bookings(month_start)

    # — Booking Count —
    count_res = await db.execute(
        select(func.count(Booking.id)).where(Booking.created_at >= day_start)
    )
    today_count = int(count_res.scalar() or 0)

    # — Surge Factor: Demand Multiplier Ortalaması —
    try:
        from app.db.models.service import Service as SvcModel
        surge_res = await db.execute(select(func.avg(SvcModel.demand_multiplier)))
        avg_surge = float(surge_res.scalar() or 1.0)
    except Exception:
        avg_surge = 1.0

    # — Forecast: Gün sonu tahmini (saat bazlı ekstrapolasyon) —
    elapsed_hours = max(1, (now - day_start).seconds // 3600)
    daily_run_rate = today_rev / elapsed_hours if elapsed_hours > 0 else 0
    projected_eod  = daily_run_rate * 24 * avg_surge
    projected_eom  = month_rev + (projected_eod * (30 - now.day))

    # — Backtesting: Dün tahmin vs gerçek —
    yesterday_start = day_start - timedelta(days=1)
    yesterday_rev   = await sum_bookings(yesterday_start)
    # Basit accuracy: bugünkü tahmin / dün gerçek (demo)
    forecast_accuracy = round(min(100, (min(projected_eod, yesterday_rev + 0.01) /
                                        max(yesterday_rev, projected_eod, 1)) * 100), 1) if yesterday_rev > 0 else None

    # — Surge Gain (Surge'siz baz ile fark) —
    base_rev   = today_rev / avg_surge if avg_surge > 0 else today_rev
    surge_gain = round(today_rev - base_rev, 2)

    return {
        "status": "success",
        "snapshot_time": now.isoformat(),
        "avg_surge_factor": round(avg_surge, 3),
        "today": {
            "bookings": today_count,
            "revenue": round(today_rev, 2),
            "surge_gain": surge_gain,
            "projected_eod": round(projected_eod, 2)
        },
        "week":  {"revenue": round(week_rev, 2)},
        "month": {"revenue": round(month_rev, 2), "projected_eom": round(projected_eom, 2)},
        "backtesting": {
            "yesterday_actual": round(yesterday_rev, 2),
            "forecast_accuracy_pct": forecast_accuracy
        }
    }


@app.get("/api/v1/revenue/ltv-churn")
async def get_ltv_churn(db: AsyncSession = Depends(get_db)):
    """
    LTV & Churn Radar:
    - Her müşteri için Lifetime Value ve churn riski
    - 60+ gün gelmeyenler → CHURN ALERT
    """
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    CHURN_THRESHOLD_DAYS = 60
    AVG_VISIT_INTERVAL_DAYS = 30  # beklenen ziyaret aralığı

    cust_res = await db.execute(
        select(Customer)
        .options(selectinload(Customer.bookings))
        .order_by(Customer.total_spent.desc())
        .limit(50)
    )
    customers = cust_res.scalars().all()

    profiles = []
    total_ltv = 0.0
    churn_alerts = []

    for c in customers:
        visits = int(c.visit_count or len(c.bookings or []))
        total  = float(c.total_spent or 0)
        avg_per_visit = (total / visits) if visits > 0 else 0

        # LTV: Basit modelde → toplam_harcama × beklenen_residual_ömür (ziyaret × 12 ay)
        residual_visits = max(0, 24 - visits)  # 2 yıllık ömür varsayımı
        ltv = round(total + avg_per_visit * residual_visits, 2)

        # Churn
        days_since = None
        churn_risk = "LOW"
        if c.last_visit:
            days_since = (now - c.last_visit).days
            if days_since > CHURN_THRESHOLD_DAYS:
                churn_risk = "HIGH"
                churn_alerts.append({
                    "name": c.full_name,
                    "days_absent": days_since,
                    "ltv_at_risk": ltv
                })
            elif days_since > CHURN_THRESHOLD_DAYS // 2:
                churn_risk = "MEDIUM"

        total_ltv += ltv
        profiles.append({
            "id": str(c.id),
            "name": c.full_name,
            "visits": visits,
            "total_spent": total,
            "avg_per_visit": round(avg_per_visit, 2),
            "ltv": ltv,
            "days_since_visit": days_since,
            "churn_risk": churn_risk
        })

    # Revenue at risk from high-churn customers
    rev_at_risk = sum(a["ltv_at_risk"] for a in churn_alerts)

    return {
        "status": "success",
        "total_ltv_portfolio": round(total_ltv, 2),
        "churn_alerts": churn_alerts,
        "revenue_at_risk": round(rev_at_risk, 2),
        "profiles": profiles
    }


@app.post("/api/v1/revenue/ai-boost")
async def get_ai_revenue_boost(db: AsyncSession = Depends(get_db)):
    """
    AI Revenue Boost (Gemini):
    Mevcut kapasiteyi, booking verisini ve surge'ü analiz edip
    aksiyon odaklı gelir artırma önerisi üretir.
    """
    from datetime import datetime, timedelta
    import asyncio, os
    from sqlalchemy import func

    now = datetime.utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Veri topla
    today_res = await db.execute(
        select(func.sum(Booking.price_snapshot), func.count(Booking.id))
        .where(Booking.created_at >= day_start)
        .where(Booking.status == BookingStatus.CONFIRMED)
    )
    row = today_res.one()
    today_rev   = float(row[0] or 0)
    today_count = int(row[1] or 0)

    # En popüler servis
    top_svc_res = await db.execute(
        select(Service.name, func.count(Booking.id).label("cnt"))
        .join(Booking, Booking.service_id == Service.id)
        .where(Booking.created_at >= day_start - timedelta(days=7))
        .group_by(Service.name)
        .order_by(desc("cnt"))
        .limit(3)
    )
    top_services = [r[0] for r in top_svc_res.fetchall()]

    # High-LTV müşteri sayısı
    vip_res = await db.execute(
        select(func.count(Customer.id)).where(Customer.total_spent >= 1000)
    )
    vip_count = int(vip_res.scalar() or 0)

    elapsed_hours = max(1, (now - day_start).seconds // 3600)
    remaining_hours = max(1, 24 - elapsed_hours)
    run_rate = today_rev / elapsed_hours

    # Gemini AI Aksiyon Önerisi
    boost_suggestion = (
        f"Current run rate is €{run_rate:.0f}/hr. "
        f"With {remaining_hours} hours remaining, consider activating surge pricing "
        f"on {top_services[0] if top_services else 'top services'} to capture €{run_rate * remaining_hours * 0.3:.0f} additional revenue."
    )

    try:
        from dotenv import load_dotenv
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""Sen Santis Revenue Intelligence motoru olarak çalışıyorsun.
Aşağıdaki günlük veriyi analiz et ve 2-3 cümlelik, aksiyon odaklı, özgüvenli bir gelir artırma tavsiyesi üret.
Rakamsal tahmin içersin. Türkçe değil, İngilizce yaz. Selamlama yok. Direkt aksiyonla başla.

Bugünkü Gelir: €{today_rev:,.0f}
Bugünkü Booking Sayısı: {today_count}
Günlük Run Rate: €{run_rate:.0f}/saat
Kalan Saat: {remaining_hours} saat
En Popüler Servisler (son 7 gün): {', '.join(top_services) if top_services else 'N/A'}
Yüksek Değerli Misafirler (€1000+): {vip_count} kişi

Tavsiyeni ver:"""
            resp = await asyncio.to_thread(model.generate_content, prompt)
            if resp and resp.text:
                boost_suggestion = resp.text.strip()
    except Exception as e:
        print(f"[Phase H] AI Boost error: {e}")

    projected_extra = round(run_rate * remaining_hours * 0.25, 2)

    return {
        "status": "success",
        "snapshot_time": now.isoformat(),
        "today_revenue": today_rev,
        "today_bookings": today_count,
        "run_rate_per_hour": round(run_rate, 2),
        "remaining_hours": remaining_hours,
        "projected_extra_revenue": projected_extra,
        "top_services": top_services,
        "vip_count": vip_count,
        "ai_boost_suggestion": boost_suggestion
    }


@app.get("/api/v1/guest/zen-feed")
async def get_guest_zen_feed(db: AsyncSession = Depends(get_db)):
    # Prototype: Fetch the first customer and their room (from booking)
    cust_res = await db.execute(select(Customer).limit(1))
    c1 = cust_res.scalar_one_or_none()
    
    b1 = None
    if c1:
        booking_res = await db.execute(
            select(Booking).where(Booking.customer_id == c1.id).order_by(desc(Booking.created_at)).limit(1)
        )
        b1 = booking_res.scalar_one_or_none()
    
    guest_name = c1.full_name if c1 else "Valued Guest"
    tenant_id = c1.tenant_id if c1 else 1
    
    room_number = "101"
    if b1 and b1.room_id:
        r_res = await db.execute(select(Room).where(Room.id == b1.room_id))
        room = r_res.scalar_one_or_none()
        if room:
            room_number = room.name
            
    # Generate AI Recommendation
    ai_title = "Signature AI Wellness"
    ai_desc = "Personalized therapy for your mind and body."
    ai_price = 150
            
    try:
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.5-flash") # Using 2.5-flash for speed
            
            prompt = f"""Sen lüks otel içi Master OS yapay zekasısın. 
            Müşteri adı: {guest_name}. 
            Bu müşteri için kısa, baştan çıkarıcı, "Quiet Luxury" standartlarında MÜKEMMEL bir masaj/spa önerisi oluştur.
            Sadece JSON dön. Şablon:
            {{"title": "Kısa Çarpıcı İngilizce Başlık", "desc": "1 cümlelik detaylı ingilizce açıklama", "price": "190"}}
            Asla ekstra metin yazma, sadece saf JSON döndür.
            """
            import asyncio
            response = await asyncio.to_thread(model.generate_content, prompt)
            if response and response.text:
                 text_clean = response.text.replace("```json", "").replace("```", "").strip()
                 import json as pyljson
                 ai_data = pyljson.loads(text_clean)
                 ai_title = ai_data.get("title", ai_title)
                 ai_desc = ai_data.get("desc", ai_desc)
                 ai_price = float(ai_data.get("price", ai_price))
    except Exception as e:
        pass # fallback to defaults

    return {
        "status": "success",
        "guest": {
            "name": guest_name,
            "room": room_number,
            "tenant_id": tenant_id
        },
        "recommendation": {
            "title": ai_title,
            "desc": ai_desc,
            "price": ai_price
        }
    }

from sqlalchemy import select, func, desc
from datetime import date
from sqlalchemy.orm import selectinload
from app.db.models.tenant import Tenant
from app.db.models.revenue import DailyRevenue
from app.db.models.booking import Booking
import google.generativeai as genai
from app.core.config import settings
from app.db.session import get_db
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

@app.get("/api/v1/tenant/dashboard")
async def get_tenant_dashboard(tenant_id: str = "2", db: AsyncSession = Depends(get_db)):
    
    # 1. Tenant Data
    parsed_tenant_id = None
    try:
        # Assuming we just fetch the first tenant if format is wrong for now, or match by name
        res = await db.execute(select(Tenant).limit(1))
        tenant = res.scalar_one_or_none()
        if tenant:
             parsed_tenant_id = tenant.id
    except Exception:
        pass
        
    if not tenant:
        return {"error": "Tenant not found"}
        
    # 2. Revenue Data (Today)
    today = date.today()
    rev_res = await db.execute(select(DailyRevenue).where(DailyRevenue.tenant_id == parsed_tenant_id, DailyRevenue.date == today))
    daily_rev = rev_res.scalar_one_or_none()
    today_revenue = float(daily_rev.daily_revenue) if (daily_rev and daily_rev.daily_revenue is not None) else 0.0

    # 3. Live Bookings Feed (Top 5)
    booking_res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.room), selectinload(Booking.customer))
        .where(Booking.tenant_id == parsed_tenant_id)
        .order_by(desc(Booking.created_at))
        .limit(5)
    )
    bookings = booking_res.scalars().all()
    
    feed = []
    for b in bookings:
        # Phase 6: Sentient Profiling extraction
        ai_intel = None
        if hasattr(b, 'customer') and b.customer and hasattr(b.customer, 'ai_persona_summary'):
            ai_intel = b.customer.ai_persona_summary

        feed.append({
            "booked_at": b.start_time.strftime("%H:%M") if b.start_time else "N/A",
            "guest_name": b.customer.full_name if hasattr(b, 'customer') and b.customer else "Walk-in",
            "room_number": b.room.name if hasattr(b, 'room') and b.room else "WALK-IN",
            "service_name": b.service.name if hasattr(b, 'service') and b.service else "Unknown",
            "price_charged": float(b.price_snapshot) if b.price_snapshot is not None else 0.0,
            "status": b.status.value if hasattr(b, 'status') and hasattr(b.status, 'value') else "PENDING",
            "ai_persona": ai_intel
        })

    # 4. Gemini AI Directive
    ai_directive = "AI Motoru Hazırlanıyor..."
    try:
        from dotenv import load_dotenv
        import os
        load_dotenv(override=True)
        current_api_key = os.getenv("GEMINI_API_KEY")
        if current_api_key:
            genai.configure(api_key=current_api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            from datetime import datetime
            current_hour = datetime.now().strftime("%H:%M")
            prompt = f"""Sen Santis Master OS isimli dünya standartlarında ultra-lüks bir otel ağının 'Sanal Genel Müdürü' ve 'Stratejisti'sin (The Commander). 
            Aşağıdaki anlık günlük durumu incele ve otel/spa resepsiyonundaki görevli ekibe 1-2 cümlelik çok sert, net ve aksiyon odaklı bir TAVSİYE veya EMİR (Directive) ver. 
            Tonlama: "Quiet Luxury" vizyonuna uygun, profesyonel ama acımasızca verimli.
            - Otel: {tenant.name} ({getattr(tenant, 'city', 'Antalya')}, {getattr(tenant, 'country', 'TR')})
            - Anlık Saat: {current_hour}
            - Bugünün Elde Edilen Geliri: €{today_revenue}
            - Bugünkü Aktif İşlemler: {len(feed)} adet.
            
            Eğer Saat sabah ise: "Günün enerjisini yükseltin, upsell yapın." minvalinde.
            Eğer Saat akşam ise: "Rahatlama seanslarını (Hamam/Relax) otel misafirlerine SMS ile atın." minvalinde.
            Ciro düşükse daha agresif satış, yüksekse kalite kontrol emri ver. Asla merhaba/teşekkür etme. Direkt komutu ver.
            """
            
            response = model.generate_content(prompt)
            if response and response.text:
                 ai_directive = response.text.replace("*", "").replace("\n", " ")
    except Exception as e:
        ai_directive = f"Master OS bağlantı hatası: Sistemsel gecikme. (Tavsiye: Manuel CRM kontrollerinize devam ediniz.)"

    return {
        "hotel": {
            "name": tenant.name,
            "city": getattr(tenant, 'city', 'Antalya'),
            "country": getattr(tenant, 'country', 'Turkey')
        },
        "performance": {
            "today_revenue": today_revenue
        },
        "feed": feed,
        "ai_directive": ai_directive
    }

# 📌 5.5️⃣ Admin Master JSON Editor (Content Studio)
@app.get("/api/admin/raw-file")
async def get_raw_file(path: str):
    """Fetches a raw JSON file for the Admin Master Editor."""
    # Security constraint: only allow fetching files within assets/data
    if ".." in path or not path.startswith("assets/data/"):
        raise HTTPException(status_code=403, detail="Erişim reddedildi. Yalnızca data/ klasörü okunabilir.")
        
    full_path = BASE_DIR / path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="Dosya bulunamadı.")
        
    with open(full_path, "r", encoding="utf-8") as f:
        try:
            content = json.load(f)
            return {"status": "success", "content": content}
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Dosya geçerli bir JSON formatında değil.")

class RawFilePayload(BaseModel):
    path: str
    content: dict

@app.post("/api/admin/raw-file")
async def save_raw_file(payload: RawFilePayload):
    """Saves edited JSON content securely back to disk."""
    path = payload.path
    if ".." in path or not path.startswith("assets/data/"):
        raise HTTPException(status_code=403, detail="Erişim reddedildi. Yalnızca data/ klasörüne yazılabilir.")
        
    full_path = BASE_DIR / path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Güncellenecek dosya bulunamadı.")
        
    try:
        with open(full_path, "w", encoding="utf-8") as f:
            json.dump(payload.content, f, ensure_ascii=False, indent=2)
        return {"status": "success", "message": f"{path} güncellendi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import RedirectResponse

# 📌 5.6️⃣ Portal & Dashboard Redirects
@app.get("/hq-dashboard", response_class=RedirectResponse)
async def hq_dashboard_base(): return RedirectResponse(url="/hq-dashboard/index.html", status_code=301)
@app.get("/hq-dashboard/", response_class=RedirectResponse)
async def hq_dashboard_slash(): return RedirectResponse(url="/hq-dashboard/index.html", status_code=301)

@app.get("/admin", response_class=RedirectResponse)
async def admin_base(): return RedirectResponse(url="/admin/index.html", status_code=301)
@app.get("/admin/", response_class=RedirectResponse)
async def admin_slash(): return RedirectResponse(url="/admin/index.html", status_code=301)

@app.get("/tenant-dashboard", response_class=RedirectResponse)
async def tenant_dashboard_base(): return RedirectResponse(url="/tenant-dashboard/index.html", status_code=301)
@app.get("/tenant-dashboard/", response_class=RedirectResponse)
async def tenant_dashboard_slash(): return RedirectResponse(url="/tenant-dashboard/index.html", status_code=301)

@app.get("/guest-zen", response_class=RedirectResponse)
async def guest_zen_base(): return RedirectResponse(url="/guest-zen/index.html", status_code=301)
@app.get("/guest-zen/", response_class=RedirectResponse)
async def guest_zen_slash(): return RedirectResponse(url="/guest-zen/index.html", status_code=301)

# 📌 6️⃣ HTML Route (TR Pages & Home)
@app.get("/")
async def homepage():
    return FileResponse(BASE_DIR / "index.html")

@app.get("/{file_name}.html")
async def serve_root_html(file_name: str):
    # Security check 
    if ".." in file_name:
        return FileResponse(BASE_DIR / "404.html", status_code=404)
        
    file_path = BASE_DIR / f"{file_name}.html"
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(BASE_DIR / "404.html", status_code=404)



# ═══════════════════════════════════════════════════════════════
# 📌 PHASE M – CANCELLATION LIQUIDITY RECOVERY ENGINE
# Booking iptal → DNA-match → Flash Offer → WebSocket Broadcast
# ═══════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════
# 📌 PHASE O – INVENTORY SCARCITY ENGINE
# Stok kritik → demand_multiplier +0.10/+0.25 bump → Neural alert
# ═══════════════════════════════════════════════════════════════

async def get_scarcity_bumps(db: AsyncSession) -> dict:
    """
    Phase O helper: returns {service_id: bump} for services with critical stock.
    Called from Phase J auto_pricing_worker every cycle.
    """
    res = await db.execute(text("""
        SELECT service_id, item_name, current_stock, min_threshold, is_luxury
        FROM service_inventory
        WHERE current_stock <= min_threshold
    """))
    rows = res.fetchall()
    bumps = {}
    for service_id, item_name, stock, threshold, is_luxury in rows:
        bump = 0.25 if is_luxury else 0.10
        bumps[service_id] = {"bump": bump, "item": item_name, "stock": stock, "threshold": threshold}
    return bumps


@app.get("/api/v1/inventory")
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


@app.patch("/api/v1/inventory/{item_id}")
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
        "item_name": row.item_name,
        "new_stock": new_stock,
        "is_critical": is_critical,
        "scarcity_bump": bump
    }


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE VISUAL – GALLERY ASSET ENGINE
# GalleryAsset CRUD + multipart upload + Phase J/O entegrasyonu
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/gallery/assets")
async def get_gallery_assets(
    category: str = "",
    lang:     str = "tr",
    slot:     str = "",
    slots:    str = "",
    search:   str = "",
    db: AsyncSession = Depends(get_db)
):
    """Gallery list — optional category/slot/search filter; includes live multiplier + scarcity."""
    import json as _j
    where = "WHERE is_published = 1"
    params = {}
    if category and category != "all":
        where += " AND category = :cat"
        params["cat"] = category

    # Text search across filename and slot
    if search:
        where += " AND (filename LIKE :search OR COALESCE(slot,'') LIKE :search)"
        params["search"] = f"%{search}%"

    # Single slot filter (exact match or prefix with trailing -)
    if slot:
        if slot.endswith("-"):
            where += " AND slot LIKE :slot"
            params["slot"] = f"{slot}%"
        else:
            where += " AND slot = :slot"
            params["slot"] = slot

    # Batch slot filter (comma-separated)
    if slots:
        slot_list = [s.strip() for s in slots.split(",") if s.strip()]
        if slot_list:
            placeholders = ",".join([f":sl{i}" for i in range(len(slot_list))])
            where += f" AND slot IN ({placeholders})"
            for i, s in enumerate(slot_list):
                params[f"sl{i}"] = s

    res = await db.execute(
        text(f"""
            SELECT id, filename, filepath, category,
                   caption_tr, caption_en, caption_de,
                   linked_service_id, sort_order, uploaded_at, slot
            FROM gallery_assets {where}
            ORDER BY sort_order ASC, uploaded_at DESC
        """), params
    )
    rows = res.fetchall()

    # Phase J: live multiplier
    mult_res = await db.execute(text("SELECT AVG(demand_multiplier) FROM services WHERE is_active=1"))
    multiplier = round(float(mult_res.scalar() or 1.0), 2)

    # Phase O: critical items by service
    scarcity_bumps = {}
    try:
        scarcity_bumps = await get_scarcity_bumps(db)
    except Exception:
        pass

    caption_key = {"tr": "caption_tr", "en": "caption_en", "de": "caption_de"}.get(lang, "caption_tr")

    assets = []
    for row in rows:
        sid = str(row[7]) if row[7] else None
        is_scarce = sid in scarcity_bumps if sid else False
        cap_map = {"caption_tr": row[4], "caption_en": row[5], "caption_de": row[6]}
        assets.append({
            "id":                 row[0],
            "filename":           row[1],
            "filepath":           row[2],
            "url":                f"/{row[2]}",
            "category":           row[3],
            "caption":            cap_map.get(caption_key, row[4]),
            "linked_service_id":  sid,
            "sort_order":         row[8],
            "uploaded_at":        str(row[9]),
            "slot":               row[10],
            "demand_multiplier":  multiplier,
            "is_scarce":          is_scarce,
            "scarcity_label":     "Limited Availability" if is_scarce else None,
        })

    return {"assets": assets, "total": len(assets), "multiplier": multiplier}

    return {"assets": assets, "total": len(assets), "multiplier": multiplier}

# Note: get_gallery_slots moved to app/api/v1/endpoints/gallery.py
# to fix Route Shadowing issue.


# ── Phase 9.5A: CRM Trace Endpoint (Ghost Tracker → Event Bus) ──
from app.db.session import AsyncSessionLocal

@app.post("/api/v1/crm/trace")
async def crm_trace(request: Request):
    """Ghost Tracker sends intent data here. Atomic write to CRM + Event Bus."""
    import uuid
    from datetime import datetime

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    session_id = body.get("session_id", "unknown")
    tenant_id = body.get("tenant_id", "373b8999d83340ef9dd1eef5ecb37d69")
    action_type = body.get("action_type", "unknown")
    target_element = body.get("target_element", "")
    intent_delta = float(body.get("intent_score_delta", 0))
    payload = body.get("payload", {})
    trace_id = str(uuid.uuid4().hex)
    now = datetime.now().isoformat()
    idem_key = f"{session_id}_{action_type}_{target_element}_{int(datetime.now().timestamp())}"

    async with AsyncSessionLocal() as db:
        # Atomic: CRM trace + Event Bus in same transaction
        await db.execute(text(
            "INSERT INTO crm_guest_traces (id, timestamp, session_id, tenant_id, action_type, target_element, intent_score, payload) "
            "VALUES (:id, :ts, :sid, :tid, :act, :target, :intent, :payload)"
        ), {"id": trace_id, "ts": now, "sid": session_id, "tid": tenant_id,
            "act": action_type, "target": target_element, "intent": intent_delta,
            "payload": json.dumps(payload)})

        await db.execute(text(
            "INSERT INTO outbox_events (event_type, payload, status, created_at, tenant_id, source, attempts, idempotency_key) "
            "VALUES (:etype, :payload, 'PENDING', :ts, :tid, 'ghost', 0, :idem)"
        ), {"etype": f"visitor.{action_type}", "payload": json.dumps({"trace_id": trace_id, "target": target_element, "intent_delta": intent_delta}),
            "ts": now, "tid": tenant_id, "idem": idem_key})

        await db.commit()
    return {"status": "accepted", "trace_id": trace_id}


# ── Phase 9.5B: Decision Engine ─────────────────────────────────
@app.get("/api/v1/ai/decision-rules")
async def get_decision_rules():
    """List active decision rules."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT * FROM decision_rules WHERE enabled = 1 ORDER BY priority DESC"))
        rules = [dict(r._mapping) for r in result.fetchall()]
    return {"rules": rules, "total": len(rules)}


@app.get("/api/v1/ai/shadow-log")
async def get_shadow_log():
    """View shadow decision log for AI accuracy analysis."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(text(
            "SELECT * FROM shadow_decisions ORDER BY created_at DESC LIMIT 50"
        ))
        logs = [dict(r._mapping) for r in result.fetchall()]
    return {"decisions": logs, "total": len(logs)}


# ── Phase 11: Conversion Oracle — Banner Analytics ──────────────
@app.get("/api/v1/ai/banner-stats")
async def get_banner_stats():
    """Conversion Oracle: impressions, clicks, conversion rate, revenue lift."""
    async with AsyncSessionLocal() as db:
        r1 = await db.execute(text("SELECT COUNT(*) FROM banner_impressions"))
        impressions = r1.scalar() or 0

        r2 = await db.execute(text("SELECT COUNT(*) FROM banner_clicks"))
        clicks = r2.scalar() or 0

        r3 = await db.execute(text(
            "SELECT COALESCE(SUM(lift_estimate),0) FROM shadow_decisions WHERE was_autonomous=1"
        ))
        revenue_lift = float(r3.scalar() or 0)

        r4 = await db.execute(text(
            "SELECT COUNT(*) FROM shadow_decisions WHERE was_autonomous=1"
        ))
        autonomous_fired = r4.scalar() or 0

    conversion_rate = round((clicks / impressions * 100), 1) if impressions > 0 else 0
    ai_accuracy = round((autonomous_fired / max(impressions, 1)) * 100, 1)

    return {
        "impressions": impressions,
        "clicks": clicks,
        "conversion_rate": conversion_rate,
        "revenue_lift": revenue_lift,
        "autonomous_fired": autonomous_fired,
        "ai_accuracy": min(ai_accuracy, 99.9),
        "glow_active": conversion_rate >= 15
    }


@app.post("/api/v1/ai/banner-impression")
async def log_banner_impression(request: Request):
    """Log that a banner was shown to a visitor."""
    body = await request.json()
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "INSERT INTO banner_impressions (session_id, tenant_id, event_id, action, discount_pct) "
            "VALUES (:sid, :tid, :eid, :action, :disc)"
        ), {
            "sid": body.get("session_id", "anon"),
            "tid": body.get("tenant_id", "system"),
            "eid": body.get("event_id", ""),
            "action": body.get("action", "FLASH_OFFER"),
            "disc": body.get("discount_pct", 10)
        })
        await db.commit()
    return {"status": "logged"}


@app.post("/api/v1/ai/banner-click")
async def log_banner_click(request: Request):
    """Log a click on the urgency banner."""
    body = await request.json()
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "INSERT INTO banner_clicks (session_id, tenant_id, impression_id, converted) "
            "VALUES (:sid, :tid, :iid, :conv)"
        ), {
            "sid": body.get("session_id", "anon"),
            "tid": body.get("tenant_id", "system"),
            "iid": body.get("impression_id", None),
            "conv": int(body.get("converted", 0))
        })
        await db.commit()
    return {"status": "click_logged"}


# ── Phase 15: Checkout Discount Bridge — Promo Token ─────────────
@app.post("/api/v1/ai/promo-token")
async def create_promo_token(request: Request):
    """Create a session-based promo discount token (expires in 30 min)."""
    from datetime import datetime, timedelta
    import random, string
    body = await request.json()
    token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    expires_at = (datetime.now() + timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S')
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "INSERT INTO promo_tokens (id, session_id, discount_pct, action, expires_at, used) "
            "VALUES (:tid, :sid, :disc, :action, :exp, 0)"
        ), {
            "tid": token,
            "sid": body.get("session_id", "anon"),
            "disc": float(body.get("discount_pct", 10)),
            "action": body.get("action", "FLASH_OFFER"),
            "exp": expires_at
        })
        await db.commit()
    return {
        "token": token,
        "discount_pct": body.get("discount_pct", 10),
        "expires_at": expires_at,
        "display": f"NV-{token}",
        "message": f"🎁 %{int(body.get('discount_pct', 10))} İndirim Kodunuz: NV-{token}"
    }


@app.get("/api/v1/ai/promo-token/{token}")
async def validate_promo_token(token: str):
    """Validate a promo token and return discount info."""
    from datetime import datetime
    async with AsyncSessionLocal() as db:
        r = await db.execute(text(
            "SELECT id, discount_pct, action, expires_at, used FROM promo_tokens WHERE id = :tid"
        ), {"tid": token.upper()})
        row = r.fetchone()

    if not row:
        return {"valid": False, "reason": "Token bulunamadı"}
    if row[4]:
        return {"valid": False, "reason": "Token daha önce kullanıldı", "discount_pct": row[1]}
    if row[3] and datetime.now() > datetime.strptime(str(row[3]), '%Y-%m-%d %H:%M:%S'):
        return {"valid": False, "reason": "Token süresi doldu", "discount_pct": row[1]}

    return {
        "valid": True,
        "token": row[0],
        "discount_pct": row[1],
        "action": row[2],
        "display": f"NV-{row[0]}",
        "whatsapp_text": f"🎁 Promo Kodum: NV-{row[0]} | %{int(row[1])} İndirim"
    }


@app.post("/api/v1/ai/promo-token/{token}/use")
async def use_promo_token(token: str):
    """Mark a promo token as used after reservation."""
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "UPDATE promo_tokens SET used=1 WHERE id=:tid"
        ), {"tid": token.upper()})
        await db.commit()
    return {"status": "used", "token": token.upper()}


# ── Phase 16: Sentiment Concierge — Gemini Powered Chat ──────────
@app.post("/api/v1/ai/concierge-chat")
async def concierge_chat(request: Request):
    """
    Gemini-powered conversational concierge.
    Accepts: guest_name, message, intent_score, behavioral_tags, history[]
    Returns: ai_reply, booking_suggested, whatsapp_cta
    """
    import re, json as _json

    body = await request.json()
    guest_name    = body.get("guest_name", "Değerli Misafirimiz")
    message       = body.get("message", "")
    intent_score  = int(body.get("intent_score", 50))
    behavioral_tags = body.get("behavioral_tags", [])   # e.g. ["high_intent","returning"]
    history       = body.get("history", [])             # [{role:user/ai, text:...}]
    service_hint  = body.get("service_interest", "")
    promo_token   = body.get("promo_token", "")

    if not message.strip():
        return {"ai_reply": "Sizi duyuyorum, lütfen devam edin.", "booking_suggested": False}

    # Get API key
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        from pathlib import Path as _P
        _ef = _P(__file__).parent / ".env"
        if _ef.exists():
            for _l in _ef.read_text().splitlines():
                if _l.startswith("GEMINI_API_KEY="):
                    api_key = _l.split("=", 1)[1].strip()
                    break

    if not api_key:
        return {"ai_reply": "Konciyer şu an bakımda. Lütfen WhatsApp'tan ulaşın.", "booking_suggested": True,
                "whatsapp_cta": {"label": "WhatsApp ile Rezervasyon", "phone": "905555555555", "text": "Santis rezervasyon talebi"}}

    # ── Build Santis Brand System Prompt ─────────────────────────
    urgency_note = ""
    if intent_score >= 75:
        urgency_note = "This guest has HIGH booking intent (score={intent_score}/100). Gently guide toward reservation NOW.".format(intent_score=intent_score)
    elif intent_score >= 50:
        urgency_note = "Guest intent is moderate. Build desire, describe the experience, then suggest booking."
    else:
        urgency_note = "Guest is exploring. Be warm and informative. Do not push booking yet."

    tags_note = f"Behavioral profile: {', '.join(behavioral_tags)}." if behavioral_tags else ""
    svc_note  = f"Guest shows interest in: {service_hint}." if service_hint else ""
    promo_note = f"Guest has promo token {promo_token} — mention their special discount naturally." if promo_token else ""

    system_prompt = f"""You are the AI Concierge for Santis, a premium luxury spa in Antalya, Turkey.

BRAND VOICE: Elegant, warm, knowledgeable. Like a trusted Maitre d'Hotel. Never robotic or generic.
LANGUAGE: Reply in Turkish unless guest writes in another language.
STYLE: 2-3 sentences max. Rich sensory language. Reference specific treatments when relevant.
{urgency_note}
{tags_note}
{svc_note}
{promo_note}

SERVICES (reference naturally when relevant):
- Osmanlı Hammam Ritüeli – Steam, exfoliation, marble relaxation
- Derin Doku Masajı – Deep tissue, tension release
- Sothys Yüz Bakımı – French luxury skincare
- Aromaterapik Masaj – Essential oils, harmony
- Taş Terapisi – Hot stone, deep warmth
- Çift Ritüel – Couples spa journey
- VIP Özel Protokol – Bespoke luxury experience

RULES:
- Never make up prices (say 'kişiye özel' for pricing)
- Always end with an implicit or explicit invitation
- If guest is ready to book, tell them their personal WhatsApp link awaits
- JSON format: {{"reply": "your response", "booking_suggested": true/false}}"""

    # Build conversation
    conversation_text = system_prompt + "\n\n"
    for h in history[-6:]:  # Last 6 turns
        role = "Misafir" if h.get("role") == "user" else "Konciyer"
        conversation_text += f"{role}: {h.get('text','')}\n"
    conversation_text += f"Misafir: {message}\nKonciyer:"

    try:
        import google.generativeai as _genai
        import asyncio as _asyncio
        _genai.configure(api_key=api_key)
        _model = _genai.GenerativeModel("gemini-2.0-flash")
        loop = _asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: _model.generate_content(conversation_text))
        raw = resp.text.strip()

        # Try JSON parse
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            parsed = _json.loads(m.group())
            ai_reply = parsed.get("reply", raw)
            booking_suggested = bool(parsed.get("booking_suggested", False))
        else:
            ai_reply = raw
            booking_suggested = intent_score >= 70

        # Build WhatsApp CTA
        phone    = (os.environ.get("NV_CONCIERGE_NUMBER") or "905555555555").replace("+", "")
        wa_lines = [f"Merhaba, Santis rezervasyon talebim var."]
        if service_hint:
            wa_lines.append(f"İlgilendiğim hizmet: {service_hint}")
        if promo_token:
            wa_lines.append(f"Promo kodum: {promo_token}")
        wa_text = " | ".join(wa_lines)

        return {
            "ai_reply": ai_reply,
            "booking_suggested": booking_suggested,
            "intent_score": intent_score,
            "whatsapp_cta": {
                "label": "WhatsApp ile Rezerve Et 🌿",
                "phone": phone,
                "text": wa_text,
                "url": f"https://wa.me/{phone}?text={wa_text.replace(' ', '%20')}"
            } if booking_suggested else None
        }

    except Exception as e:
        return {
            "ai_reply": f"Merhaba {guest_name}, size en kısa sürede dönmek için buradayım.",
            "booking_suggested": False,
            "error": str(e)[:100]
        }


# ── Phase 14: Gemini Neural Endpoints ────────────────────────────
@app.get("/api/v1/ai/accuracy")
async def get_ai_accuracy():
    """Real AI accuracy: Gemini recommendation vs rule decision alignment rate."""
    async with AsyncSessionLocal() as db:
        r = await db.execute(text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN ai_recommendation = rule_decision THEN 1 ELSE 0 END) as matched,
                AVG(COALESCE(ai_confidence, 0.5)) as avg_confidence,
                SUM(CASE WHEN gemini_source = 'gemini_live' THEN 1 ELSE 0 END) as gemini_backed
            FROM shadow_decisions
        """))
        row = r.fetchone()
    total = row[0] or 0
    matched = row[1] or 0
    avg_conf = round(float(row[2] or 0.5) * 100, 1)
    gemini_backed = row[3] or 0
    accuracy = round((matched / total) * 100, 1) if total > 0 else 0.0
    return {
        "total_decisions": total,
        "gemini_backed": gemini_backed,
        "accuracy_pct": accuracy,
        "avg_confidence_pct": avg_conf,
        "grade": "A" if accuracy >= 80 else "B" if accuracy >= 60 else "C"
    }


@app.post("/api/v1/ai/gemini-strategy")
async def get_gemini_strategy(request: Request):
    """On-demand Gemini strategy call with live DB context."""
    import re, json as _json
    body = await request.json()
    occupancy = float(body.get("occupancy_pct", 0.65))

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        from pathlib import Path as _P
        _ef = _P(__file__).parent / ".env"
        if _ef.exists():
            for _l in _ef.read_text().splitlines():
                if _l.startswith("GEMINI_API_KEY="):
                    api_key = _l.split("=",1)[1].strip()
                    break

    if not api_key:
        return {"action": "HOLD", "confidence": 0.0, "reasoning": "API key not found", "source": "config_error"}

    try:
        import google.generativeai as _genai
        import asyncio as _asyncio
        _genai.configure(api_key=api_key)
        _model = _genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            f"You are Revenue Intelligence AI for Santis Luxury Spa Turkey. "
            f"REAL-TIME OCCUPANCY: {round(occupancy * 100)}%. "
            'Recommend ONE action. Reply ONLY as JSON no markdown: '
            '{"action":"SURGE or FLASH_OFFER or HOLD","confidence":0.0-1.0,'
            '"price_suggestion":"e.g. +15%","reasoning":"one sentence"} '
            "Rules: SURGE if occupancy>70%, FLASH_OFFER if occupancy<40%, HOLD otherwise."
        )
        loop = _asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: _model.generate_content(prompt))
        raw = resp.text.strip()
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            result = _json.loads(m.group())
            result["source"] = "gemini_live"
            return result
        return {"action": "HOLD", "confidence": 0.7, "reasoning": raw[:120], "source": "gemini_raw"}
    except Exception as e:
        return {"action": "HOLD", "confidence": 0.0, "reasoning": str(e)[:150], "source": "error"}


@app.get("/api/v1/ai/gemini-forecast")
async def get_gemini_forecast():
    """Gemini 48-hour spa forecast."""
    import re, json as _json
    from datetime import datetime as _dt, timedelta as _td

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        from pathlib import Path as _P
        _ef = _P(__file__).parent / ".env"
        if _ef.exists():
            for _l in _ef.read_text().splitlines():
                if _l.startswith("GEMINI_API_KEY="):
                    api_key = _l.split("=",1)[1].strip()
                    break

    if not api_key:
        return {"forecast_text": "API key not configured", "peak_window": "N/A", "recommended_action": "HOLD", "source": "config_error"}

    # Build minimal context from DB
    now = _dt.now()
    context = ""
    try:
        async with AsyncSessionLocal() as db:
            r1 = await db.execute(text("SELECT COUNT(*), COALESCE(SUM(price_snapshot),0) FROM bookings WHERE is_deleted=0 AND start_time >= :s"), {"s": (now - _td(days=7)).isoformat()})
            r1d = r1.fetchone()
            r2 = await db.execute(text("SELECT COUNT(*) FROM bookings WHERE is_deleted=0 AND DATE(start_time)=DATE(:t)"), {"t": now.isoformat()})
            r2d = r2.fetchone()
            context = f"Last 7 days: {r1d[0]} bookings, EUR {round(float(r1d[1]),2)}. Today: {r2d[0][0] if isinstance(r2d[0], tuple) else r2d[0]} bookings."
    except Exception:
        context = "Santis luxury spa, 8 treatment rooms, premium clientele."

    try:
        import google.generativeai as _genai
        import asyncio as _asyncio
        _genai.configure(api_key=api_key)
        _model = _genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            f"You are the Forecasting Oracle for Santis Luxury Spa Turkey. "
            f"Business context: {context} "
            "Generate a 48-hour forecast. Reply ONLY as JSON no markdown: "
            '{"forecast_text":"2-3 sentences luxury tone",'
            '"peak_window":"e.g. Saturday 14:00",'
            '"recommended_action":"SURGE or FLASH_OFFER or HOLD",'
            '"expected_revenue_lift_eur":0-500}'
        )
        loop = _asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: _model.generate_content(prompt))
        raw = resp.text.strip()
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            result = _json.loads(m.group())
            result["source"] = "gemini_live"
            return result
        return {"forecast_text": raw[:200], "peak_window": "N/A", "recommended_action": "HOLD", "source": "gemini_raw"}
    except Exception as e:
        return {"forecast_text": str(e)[:200], "peak_window": "N/A", "recommended_action": "HOLD", "source": "error"}


# ── Phase 9.2: AI Revenue Brain — Forecast Engine ──────────────
@app.get("/api/v1/ai/forecast")
async def ai_forecast():
    """48-hour occupancy forecast based on booking velocity."""
    from datetime import datetime, timedelta

    now = datetime.now()
    seven_days_ago = now - timedelta(days=7)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    async with AsyncSessionLocal() as db:
        r1 = await db.execute(text(
            "SELECT COUNT(*) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(today_start)})
        today_count = r1.scalar() or 0

        r2 = await db.execute(text(
            "SELECT COUNT(*) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(seven_days_ago)})
        week_total = r2.scalar() or 0
        avg_daily = round(week_total / 7, 1)

        r3 = await db.execute(text(
            "SELECT COALESCE(SUM(price_snapshot), 0) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(today_start)})
        today_revenue = float(r3.scalar() or 0)

        r4 = await db.execute(text(
            "SELECT COALESCE(SUM(price_snapshot), 0) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(seven_days_ago)})
        week_revenue = float(r4.scalar() or 0)
        avg_daily_revenue = round(week_revenue / 7, 2)

    CAPACITY = 50
    forecast_tomorrow = round(avg_daily * 1.05, 1)
    occupancy_pct = round((forecast_tomorrow / CAPACITY) * 100, 1)

    if occupancy_pct > 70:
        recommendation = "SURGE"
        reason = f"Predicted occupancy {occupancy_pct}% exceeds 70% threshold"
    elif occupancy_pct < 30:
        recommendation = "DISCOUNT"
        reason = f"Low predicted demand ({occupancy_pct}%) — flash offer recommended"
    else:
        recommendation = "HOLD"
        reason = f"Stable demand at {occupancy_pct}%"

    return {
        "today_bookings": today_count,
        "avg_daily_bookings": avg_daily,
        "forecast_tomorrow": forecast_tomorrow,
        "forecast_occupancy_pct": occupancy_pct,
        "today_revenue": today_revenue,
        "avg_daily_revenue": avg_daily_revenue,
        "revenue_velocity": f"€{avg_daily_revenue}/day",
        "ai_recommendation": recommendation,
        "ai_reason": reason,
        "generated_at": now.isoformat()
    }


# ── Phase 8.7: CMS Live Preview WebSocket ──────────────────────
from app.core.websocket import manager as ws_manager

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    client_type = websocket.query_params.get("client_type", "site")
    client_id = websocket.query_params.get("client_id", "anon")
    room_id = f"{client_type}_{client_id}"
    await ws_manager.connect(websocket, room_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, room_id)


@app.post("/api/v1/gallery/upload")
async def upload_gallery_asset(
    file:             UploadFile = File(...),
    category:         str        = Form("diger"),
    caption_tr:       str        = Form(""),
    caption_en:       str        = Form(""),
    caption_de:       str        = Form(""),
    linked_service_id:str        = Form(""),
    slot:             str        = Form(""),
    sort_order:       int        = Form(0),
    db: AsyncSession = Depends(get_db)
):
    """Phase Visual – Upload a gallery asset and register in DB."""
    import os as _os, uuid as _uuid, shutil as _sh
    from fastapi import UploadFile, File, Form

    # Validate extension
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ext = _os.path.splitext(file.filename.lower())[1]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    # Save original
    upload_dir = "assets/img/uploads"
    _os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{_uuid.uuid4().hex}{ext}"
    dest = _os.path.join(upload_dir, safe_name)
    with open(dest, "wb") as f:
        _sh.copyfileobj(file.file, f)

    # ── Phase Visual: Image Factory (Pillow WebP) ──────────────
    variants  = {}
    dominant  = "#1a1a1a"
    thumb_url = f"/{dest.replace(chr(92), '/')}"
    try:
        from app.core.image_factory import process_image as _proc
        variants = _proc(dest)
        dominant = variants.get("dominant", "#1a1a1a")
        thumb_url = f"/{variants.get('thumb', dest).replace(chr(92), '/')}"
    except Exception as _e:
        print(f"[Image Factory] Warning: {_e}")

    # Resolve tenant for SaaS isolation
    tenant_res = await db.execute(text("SELECT id FROM tenants WHERE is_active = 1 LIMIT 1"))
    tenant_row = tenant_res.fetchone()
    tenant_id = str(tenant_row[0]) if tenant_row else None

    asset_id = str(_uuid.uuid4())
    await db.execute(text("""
        INSERT INTO gallery_assets
            (id, tenant_id, filename, filepath, category, caption_tr, caption_en, caption_de,
             linked_service_id, slot, sort_order, is_published, uploaded_at)
        VALUES
            (:id, :tid, :fn, :fp, :cat, :ctr, :cen, :cde, :sid, :slot, :so, 1, CURRENT_TIMESTAMP)
    """), {
        "id":  asset_id,
        "tid": tenant_id,
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
    await db.commit()

    # Phase 8.7: Broadcast live update to all connected clients
    file_url = f"/{dest.replace(chr(92), '/')}"
    try:
        await ws_manager.broadcast_global({
            "type": "CMS_ASSET_UPDATED",
            "slot": slot or None,
            "url": file_url,
            "category": category,
            "asset_id": asset_id
        })
    except Exception:
        pass  # WS failure must not block upload

    await neural_thought(
        f"Santis Gallery ∷ '{safe_name}' [{category}] uploaded. "
        f"WebP variants: {len(variants)} | Dominant: {dominant}",
        level="info"
    )

    return {
        "id":        asset_id,
        "filename":  safe_name,
        "filepath":  dest.replace("\\", "/"),
        "url":       f"/{dest.replace(chr(92), '/')}",
        "thumb_url": thumb_url,
        "dominant":  dominant,
        "variants":  {k: f"/{v.replace(chr(92), '/')}" for k,v in variants.items() if k != "dominant"},
        "category":  category,
    }


@app.patch("/api/v1/gallery/assets/{asset_id}")
async def update_gallery_asset(
    asset_id: str,
    payload:  dict = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Phase Visual – Update caption, category, service link, sort order."""
    allowed_fields = {"caption_tr", "caption_en", "caption_de", "category",
                      "linked_service_id", "sort_order", "is_published"}
    updates = {k: v for k, v in payload.items() if k in allowed_fields}
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


@app.post("/api/v1/gallery/assets/{asset_id}/view")
async def record_gallery_view(asset_id: str, db: AsyncSession = Depends(get_db)):
    """
    Phase Visual – Track asset view count.
    Every 50 views → apply +0.03x Interest Bump to Phase J demand_multiplier.
    """
    # Ensure view_count column exists (idempotent)
    try:
        await db.execute(text(
            "ALTER TABLE gallery_assets ADD COLUMN view_count INTEGER DEFAULT 0"
        ))
        await db.commit()
    except Exception:
        pass

    await db.execute(
        text("UPDATE gallery_assets SET view_count = COALESCE(view_count,0) + 1 WHERE id = :id"),
        {"id": asset_id}
    )
    await db.commit()

    # Read new count
    res = await db.execute(
        text("SELECT view_count, category FROM gallery_assets WHERE id = :id"),
        {"id": asset_id}
    )
    row = res.fetchone()
    if row:
        views, cat = row[0] or 0, row[1]
        # Interest Bump: every 50 views → +0.03x on top of current multiplier
        if views > 0 and views % 50 == 0:
            bump = 0.03
            await db.execute(text(
                "UPDATE services SET demand_multiplier = MIN(2.5, demand_multiplier + :b) WHERE is_active = 1"
            ), {"b": bump})
            await db.commit()
            await neural_thought(
                f"Santis Gallery ∷ '{cat}' visual trending — {views} views. "
                f"Interest Bump +{bump:.0%} applied to demand_multiplier.",
                level="surge"
            )
            return {"views": views, "interest_bump_applied": bump}

    return {"views": row[0] if row else 0, "interest_bump_applied": None}


@app.delete("/api/v1/gallery/assets/{asset_id}")
async def delete_gallery_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    """Phase Visual – Soft-delete (unpublish) a gallery asset."""
    await db.execute(
        text("UPDATE gallery_assets SET is_published = 0 WHERE id = :id"),
        {"id": asset_id}
    )
    await db.commit()
    return {"deleted": asset_id}


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE R – EXECUTIVE REPORTING ENGINE
# pre_computed_metrics + VIP + yield → PDF (ReportLab)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/report/executive")
async def executive_report(db: AsyncSession = Depends(get_db)):
    """Phase R – Generate and return the Santis Executive Briefing PDF."""
    import json as _j, tempfile as _tmp, os as _os
    from fastapi.responses import FileResponse as _FR
    from app.core.reporting import generate_executive_pdf
    from app.db.models.customer import Customer

    # 1. Pull cache
    async def _cache(key):
        res = await db.execute(
            text("SELECT data_json FROM pre_computed_metrics WHERE metric_key = :k"),
            {"k": key}
        )
        row = res.fetchone()
        return _j.loads(row[0]) if row else None

    ltv_data      = await _cache("nightly_ltv_snapshot")
    dna_data      = await _cache("nightly_dna_snapshot")
    scarcity_data = await _cache("nightly_scarcity_forecast")

    # 2. VIP Roster (top 10)
    vip_res = await db.execute(
        select(Customer)
        .order_by(Customer.total_spent.desc())
        .limit(10)
    )
    vip_list = [
        {
            "full_name":          v.full_name,
            "vip_tier":           "Continental" if float(v.total_spent or 0) > 5000 else "Elite",
            "total_spent":        float(v.total_spent or 0),
            "visit_count":        v.visit_count,
            "ai_persona_summary": v.ai_persona_summary or "",
        }
        for v in vip_res.scalars().all()
    ]

    # 3. Yield status
    yld_res = await db.execute(
        text("SELECT AVG(demand_multiplier) FROM services WHERE is_active = 1")
    )
    mult = float(yld_res.scalar() or 1.0)
    yield_status = {"multiplier": round(mult, 2)}

    # 4. Generate PDF
    try:
        pdf_bytes = generate_executive_pdf(
            ltv_data=ltv_data,
            dna_data=dna_data,
            scarcity_data=scarcity_data,
            vip_roster=vip_list,
            yield_status=yield_status,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {e}")

    # 5. Write to temp file & serve
    fname = f"santis_executive_{int(__import__('time').time())}.pdf"
    fpath = _os.path.join(_tmp.gettempdir(), fname)
    with open(fpath, "wb") as f:
        f.write(pdf_bytes)

    # Phase N whisper
    await neural_thought(
        "Santis Reporting ∷ Executive Briefing compiled. High-value patterns and liquidity gains ready for review.",
        level="info"
    )

    return _FR(
        path=fpath,
        filename="SantisOS_Executive_Briefing.pdf",
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=SantisOS_Executive_Briefing.pdf"}
    )


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE P – CONCIERGE MEMORY ENGINE
# Customer bazlı derin hafıza: tercihler, AI notları, vibe_check
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/guests/{customer_id}/memory")
async def get_guest_memory(customer_id: str, db: AsyncSession = Depends(get_db)):
    """Phase P – Read Concierge Memory for a guest."""
    import json as _json, uuid as _uuid
    cust = await db.get(Customer, _uuid.UUID(customer_id))
    if not cust:
        raise HTTPException(status_code=404, detail="Guest not found")

    prefs = {}
    if cust.preferences_json:
        try:
            prefs = _json.loads(cust.preferences_json)
        except Exception:
            prefs = {}

    return {
        "status":      "success",
        "guest_id":    str(cust.id),
        "guest_name":  cust.full_name,
        "preferences": prefs,
        "ai_notes":    cust.ai_notes    or "",
        "vibe_check":  cust.vibe_check  or "unknown",
        "medical_notes": "[ENCRYPTED — omitted]" if cust.medical_notes else None,
        "persona":     cust.ai_persona_summary or ""
    }


@app.patch("/api/v1/guests/{customer_id}/memory")
async def update_guest_memory(customer_id: str, payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """Phase P – Update Concierge Memory."""
    import json as _json, uuid as _uuid
    cust = await db.get(Customer, _uuid.UUID(customer_id))
    if not cust:
        raise HTTPException(status_code=404, detail="Guest not found")

    if "preferences" in payload:
        cust.preferences_json = _json.dumps(payload["preferences"], ensure_ascii=False)
    if "ai_notes" in payload:
        cust.ai_notes = payload["ai_notes"]
    if "vibe_check" in payload:
        cust.vibe_check = payload["vibe_check"]
    if "medical_notes" in payload:
        cust.medical_notes = payload["medical_notes"]

    await db.commit()

    # Phase N: neural whisper
    await neural_thought(
        f"Memory Updated → {cust.full_name} | vibe: {cust.vibe_check or '–'} | prefs saved",
        level="info"
    )

    return {"status": "success", "guest_name": cust.full_name, "updated": list(payload.keys())}


@app.post("/api/v1/guests/{customer_id}/memory/ai-observe")
async def ai_observe_guest(customer_id: str, db: AsyncSession = Depends(get_db)):
    """Phase P – Gemini generates a real-time psychological observation from booking history."""
    import json as _json, asyncio as _asyncio, uuid as _uuid
    cust = await db.get(Customer, _uuid.UUID(customer_id))
    if not cust:
        raise HTTPException(status_code=404, detail="Guest not found")

    # Booking history context
    booking_res = await db.execute(
        select(Service.name, Booking.created_at)
        .join(Booking, Booking.service_id == Service.id)
        .where(Booking.customer_id == cust.id)
        .order_by(Booking.created_at.desc())
        .limit(10)
    )
    history = [{"service": r[0], "date": r[1].strftime("%b %d")} for r in booking_res.fetchall()]

    prefs = {}
    if cust.preferences_json:
        try:
            prefs = _json.loads(cust.preferences_json)
        except Exception:
            pass

    ai_note = "Pattern analysis unavailable."
    try:
        import os, google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""Sen Santis lüks spa'nın dijital konsiyer asistanısın. 
Misafir: {cust.full_name}
Geçmiş rezervasyonlar: {history}
Bilinen tercihler: {prefs}
Psikolojik profil notu (ai_persona_summary): {cust.ai_persona_summary or 'Yok'}

Bu misafir için kısa (1-2 cümle), operasyonel bir İngilizce gözlem yaz. 
Ton: sessiz lüks (quiet luxury), profesyonel, içgörülü.
Örnek: "Guest shows strong Recovery pattern. Likely to benefit from post-workout Deep Tissue. Prefers minimal interaction."
"""
        resp = await _asyncio.to_thread(model.generate_content, prompt)
        if resp and resp.text:
            ai_note = resp.text.strip()
    except Exception as e:
        print(f"[Phase P] Gemini observe error: {e}")

    # Save to DB
    cust.ai_notes = ai_note
    await db.commit()

    # Flashback to Neural Stream
    await neural_thought(
        f"Memory ∷ {cust.full_name} — {ai_note}",
        level="info"
    )

    return {"status": "success", "guest_name": cust.full_name, "ai_observation": ai_note}


async def flashback_trigger(customer_id: str, service_name: str, db: AsyncSession):
    """
    Phase P – Flashback: rezervasyon anında misafirin hafızasını Neural Stream'e yansıt.
    Called from create_booking hook.
    """
    import json as _json
    try:
        cust = await db.get(Customer, customer_id)
        if not cust:
            return

        prefs = {}
        if cust.preferences_json:
            try:
                prefs = _json.loads(cust.preferences_json)
            except Exception:
                pass

        lines = []
        if prefs.get("allergy"):
            lines.append(f"⚠ Allergy: {prefs['allergy']}")
        if prefs.get("temp"):
            lines.append(f"🌡 Preferred temp: {prefs['temp']}°C")
        if prefs.get("pressure"):
            lines.append(f"💆 Pressure: {prefs['pressure']}")
        if cust.vibe_check and cust.vibe_check != "unknown":
            lines.append(f"Vibe: {cust.vibe_check}")
        if cust.ai_notes:
            lines.append(cust.ai_notes[:100])

        if lines:
            msg = f"Santis Memory ∷ {cust.full_name} → {service_name} | " + " | ".join(lines)
            await neural_thought(msg, level="alert" if prefs.get("allergy") else "info")
    except Exception as e:
        print(f"[Phase P] Flashback error: {e}")


FLASH_DISCOUNT = 0.20   # Slot-specific multiplier drop
FLASH_MIN      = 0.75   # Never below 75% of base


async def flash_recovery_trigger(
    booking_id: str,
    service_id: str,
    start_time: str,
    hours_left: float
):
    """
    Phase M – Cancellation Liquidity Recovery.
    Finds DNA-matched guests, drops slot multiplier, broadcasts FLASH offer.
    """
    print(f"[Phase M] ⚡ Flash recovery triggered | booking={booking_id} | {hours_left:.1f}h to start")

    try:
        async with AsyncSessionLocal() as db:
            # 1. Get service info
            svc_res = await db.execute(select(Service).where(Service.id == service_id))
            service = svc_res.scalars().first()
            if not service:
                print(f"[Phase M] Service {service_id} not found")
                return

            # 2. Drop multiplier for this slot (applies globally — acceptable for 3h window)
            current_mult = float(service.demand_multiplier or 1.0)
            new_mult     = max(FLASH_MIN, round(current_mult - FLASH_DISCOUNT, 2))
            await db.execute(
                update(Service)
                .where(Service.id == service_id)
                .values(demand_multiplier=new_mult)
            )

            # 3. Find top-3 DNA-matched guests by service category
            svc_name_lower = (service.name or "").lower()
            dna_type, _ = classify_dna([service.name])

            # Pick guests with highest spend excluding DNA mismatch
            guests_res = await db.execute(
                select(Customer)
                .where(Customer.total_spent > 0)
                .order_by(Customer.total_spent.desc())
                .limit(10)
            )
            all_guests = guests_res.scalars().all()

            # Filter for DNA-matching guests
            matched = []
            for g in all_guests:
                g_bookings = await db.execute(
                    select(Service.name)
                    .join(Booking, Booking.service_id == Service.id)
                    .where(Booking.customer_id == g.id)
                )
                g_svc_names = [r[0] for r in g_bookings.fetchall()]
                g_dna, _ = classify_dna(g_svc_names)
                if g_dna == dna_type:
                    matched.append(g)
                if len(matched) >= 3:
                    break

            await db.commit()

            # 4. Build flash offer payload
            flash_price = round(float(service.price or 0) * new_mult, 2)
            offer_payload = {
                "type":          "FLASH_RECOVERY_OFFER",
                "booking_id":    booking_id,
                "service_name":  service.name,
                "service_id":    service_id,
                "slot_time":     start_time,
                "hours_left":    hours_left,
                "original_mult": current_mult,
                "flash_mult":    new_mult,
                "flash_price":   flash_price,
                "dna_target":    dna_type,
                "target_guests": [
                    {"id": str(g.id), "name": g.full_name, "spent": float(g.total_spent or 0)}
                    for g in matched
                ],
                "message": (
                    f"⚡ {hours_left:.1f}h slot available — "
                    f"{service.name} @ €{flash_price} "
                    f"({int(FLASH_DISCOUNT*100)}% off) — "
                    f"Target: {dna_type}"
                )
            }

            # 5. Broadcast to HQ Dashboard
            await manager.broadcast_to_room(offer_payload, "hq_global")
            print(f"[Phase M] ✅ Flash offer sent | {service.name} | €{flash_price} | {len(matched)} targets")

    except Exception as e:
        print(f"[Phase M] Error: {e}")


# ── PHASE M: Manual trigger endpoint ────────────────────────────
@app.post("/api/v1/revenue/flash-recovery/simulate")
async def simulate_flash_recovery(db: AsyncSession = Depends(get_db)):
    """Test Phase M without a real cancellation — simulates a 2h-ahead slot."""
    import asyncio
    from datetime import datetime, timedelta

    res = await db.execute(select(Booking).where(Booking.status == BookingStatus.CONFIRMED).limit(1))
    b = res.scalars().first()
    if not b:
        raise HTTPException(status_code=404, detail="No confirmed bookings to simulate.")

    future_start = (datetime.utcnow() + timedelta(hours=2)).isoformat()
    asyncio.create_task(flash_recovery_trigger(
        booking_id=str(b.id),
        service_id=str(b.service_id),
        start_time=future_start,
        hours_left=2.0
    ))
    return {"status": "simulating", "message": "Flash Recovery triggered — watch HQ WebSocket for FLASH_RECOVERY_OFFER event."}


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE K – GUEST DNA CLUSTERING (registered BEFORE wildcards)
# ═══════════════════════════════════════════════════════════════
@app.get("/api/v1/guests/clusters")
async def get_guest_dna_clusters_v2(generate_ai: bool = False, db: AsyncSession = Depends(get_db)):
    """Phase K – Guest DNA Clustering Engine (wildcard-safe registration)."""
    import asyncio, os

    cust_res = await db.execute(
        select(Customer).order_by(Customer.total_spent.desc()).limit(30)
    )
    customers = cust_res.scalars().all()

    profiles = []
    cluster_counts = {"THERMAL": 0, "AESTHETIC": 0, "RECOVERY": 0, "WELLNESS": 0, "UNDEFINED": 0}

    for c in customers:
        bookings_res = await db.execute(
            select(Service.name)
            .join(Booking, Booking.service_id == Service.id)
            .where(Booking.customer_id == c.id)
        )
        svc_names = [r[0] for r in bookings_res.fetchall()]

        dna_type, pct = classify_dna(svc_names)
        persona = DNA_PERSONAS.get(dna_type, DNA_PERSONAS["UNDEFINED"])
        cluster_counts[dna_type] = cluster_counts.get(dna_type, 0) + 1

        ai_tagline = persona["tagline"]
        if generate_ai and svc_names:
            try:
                from dotenv import load_dotenv
                load_dotenv(override=True)
                api_key = os.getenv("GEMINI_API_KEY")
                if api_key:
                    import google.generativeai as genai
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel("gemini-2.5-flash")
                    prompt = (
                        f"You are Santis Club's Guest DNA engine. Write EXACTLY 1 sentence in English, "
                        f"'Quiet Luxury' tone, marketable persona description for this guest.\n"
                        f"Guest: {c.full_name} | DNA: {dna_type} | "
                        f"Services used: {', '.join(svc_names[:6])} | "
                        f"Total spend: €{float(c.total_spent or 0):,.0f}\n"
                        f"Output ONLY the sentence, no quotes, no labels."
                    )
                    resp = await asyncio.to_thread(model.generate_content, prompt)
                    if resp and resp.text:
                        ai_tagline = resp.text.strip().strip('"').strip("'")
            except Exception as e:
                print(f"[Phase K] Gemini error: {e}")

        profiles.append({
            "id":          str(c.id),
            "name":        c.full_name,
            "dna_type":    dna_type,
            "label":       persona["label"],
            "tagline":     ai_tagline,
            "scores_pct":  pct,
            "services":    svc_names[:4],
            "visit_count": int(c.visit_count or 0),
            "total_spent": float(c.total_spent or 0),
        })

    return {
        "status":          "success",
        "total_analyzed":  len(profiles),
        "cluster_summary": cluster_counts,
        "profiles":        profiles
    }


@app.get("/{lang}/{path:path}")
async def serve_pages(lang: str, path: str):
    # API routes should never be handled by this wildcard – return 404 JSON
    if lang in ("api", "hq", "ws"):
        raise HTTPException(status_code=404, detail=f"Route /{lang}/{path} not found.")

    # Security check to prevent directory traversal
    if ".." in path or ".." in lang:
        return FileResponse(BASE_DIR / "404.html", status_code=404)
        
    file_path = BASE_DIR / lang / path
    
    # Check if file exists and is a file (not directory)
    if file_path.exists():
        if file_path.is_file():
            return FileResponse(file_path)
        if file_path.is_dir():
            index_path = file_path / "index.html"
            if index_path.exists() and index_path.is_file():
                return FileResponse(index_path)
    
    # Try adding .html if missing
    if not path.endswith(".html"):
        html_path = file_path.with_suffix(".html")
        if html_path.exists() and html_path.is_file():
            return FileResponse(html_path)
            
    # Check 301 Redirect Registry before 404
    slug_candidate = path.replace(".html", "").split("/")[-1]
    
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import select
    from app.db.models.content import RedirectRegistry
    from fastapi.responses import RedirectResponse
    
    try:
        async with AsyncSessionLocal() as db:
            stmt = select(RedirectRegistry).where(
                RedirectRegistry.old_slug == slug_candidate,
                RedirectRegistry.region == lang
            )
            result = await db.execute(stmt)
            redirect_entry = result.scalar_one_or_none()
            if redirect_entry:
                new_path = path.replace(slug_candidate, redirect_entry.new_slug)
                return RedirectResponse(url=f"/{lang}/{new_path}", status_code=301)
    except Exception as e:
        pass # Fallback to 404 if DB disconnected
        
    return FileResponse(BASE_DIR / "404.html", status_code=404)


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE K – GUEST DNA CLUSTERING ENGINE
# ═══════════════════════════════════════════════════════════════

DNA_CATEGORY_KEYWORDS = {
    "THERMAL":   ["hamam", "sauna", "steam", "termal", "thermal", "royal", "bath", "kese"],
    "AESTHETIC": ["facial", "sothys", "cilt", "skin", "diamond", "youth", "care", "glow"],
    "RECOVERY":  ["massage", "masaj", "thai", "deep", "tissue", "shiatsu", "bali", "aromaterapi"],
    "WELLNESS":  ["ritual", "journey", "ayurveda", "detox", "relax", "harmony", "balance", "continental"],
}

DNA_PERSONAS = {
    "THERMAL":   {"label": "🔥 THERMAL DEVOTEE",   "tagline": "Fire & Steam — Purification as ritual."},
    "AESTHETIC": {"label": "💎 AESTHETIC ELITE",    "tagline": "Precision beauty. Zero compromise."},
    "RECOVERY":  {"label": "⚡ RECOVERY ATHLETE",  "tagline": "High-intensity life demands high-intensity recovery."},
    "WELLNESS":  {"label": "🌿 WELLNESS RITUALIST", "tagline": "Slow living. Deep presence. Balanced energy."},
    "UNDEFINED": {"label": "◈ UNCLASSIFIED",        "tagline": "Exploring the full Santis spectrum."},
}

def classify_dna(service_names: list) -> tuple:
    scores = {k: 0 for k in DNA_CATEGORY_KEYWORDS}
    for name in service_names:
        name_lower = name.lower()
        for cat, keywords in DNA_CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in name_lower:
                    scores[cat] += 1
    total = sum(scores.values()) or 1
    pct   = {k: round(v / total * 100, 1) for k, v in scores.items()}
    top   = max(scores, key=scores.get)
    if scores[top] == 0:
        top = "UNDEFINED"
    return top, pct


@app.get("/api/v1/guests/clusters")
async def get_guest_dna_clusters(generate_ai: bool = False, db: AsyncSession = Depends(get_db)):
    """Phase K – Guest DNA Clustering Engine."""
    import asyncio, os

    cust_res = await db.execute(
        select(Customer).order_by(Customer.total_spent.desc()).limit(30)
    )
    customers = cust_res.scalars().all()

    profiles = []
    cluster_counts = {"THERMAL": 0, "AESTHETIC": 0, "RECOVERY": 0, "WELLNESS": 0, "UNDEFINED": 0}

    for c in customers:
        bookings_res = await db.execute(
            select(Service.name)
            .join(Booking, Booking.service_id == Service.id)
            .where(Booking.customer_id == c.id)
        )
        svc_names = [r[0] for r in bookings_res.fetchall()]

        dna_type, pct = classify_dna(svc_names)
        persona = DNA_PERSONAS.get(dna_type, DNA_PERSONAS["UNDEFINED"])
        cluster_counts[dna_type] = cluster_counts.get(dna_type, 0) + 1

        ai_tagline = persona["tagline"]
        if generate_ai and svc_names:
            try:
                from dotenv import load_dotenv
                load_dotenv(override=True)
                api_key = os.getenv("GEMINI_API_KEY")
                if api_key:
                    import google.generativeai as genai
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel("gemini-2.5-flash")
                    prompt = (
                        f"You are Santis Club's Guest DNA engine. Write EXACTLY 1 sentence in English, "
                        f"'Quiet Luxury' tone, marketable persona description for this guest.\n"
                        f"Guest: {c.full_name} | DNA: {dna_type} | "
                        f"Services used: {', '.join(svc_names[:6])} | "
                        f"Total spend: €{float(c.total_spent or 0):,.0f}\n"
                        f"Output ONLY the sentence, no quotes, no labels."
                    )
                    resp = await asyncio.to_thread(model.generate_content, prompt)
                    if resp and resp.text:
                        ai_tagline = resp.text.strip().strip('"').strip("'")
            except Exception as e:
                print(f"[Phase K] Gemini error for {c.full_name}: {e}")

        profiles.append({
            "id":          str(c.id),
            "name":        c.full_name,
            "dna_type":    dna_type,
            "label":       persona["label"],
            "tagline":     ai_tagline,
            "scores_pct":  pct,
            "services":    svc_names[:4],
            "visit_count": int(c.visit_count or 0),
            "total_spent": float(c.total_spent or 0),
        })

    return {
        "status":          "success",
        "total_analyzed":  len(profiles),
        "cluster_summary": cluster_counts,
        "profiles":        profiles
    }




# ═══════════════════════════════════════════════════════════════
# 📌 RESILIENCE LAYER – LONG-POLL FALLBACK
# WS kopunca frontend bu endpoint'i çağırır (2-3s interval)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/admin/live-poll")
async def live_poll_fallback(db: AsyncSession = Depends(get_db)):
    """
    WebSocket fallback: WS kopunca frontend buraya geçer.
    Hafif, cache-friendly, 2-3 saniyelik polling için optimize.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import func

    now = datetime.utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Son 5 booking
    recent_res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.customer))
        .order_by(Booking.created_at.desc())
        .limit(5)
    )
    recent = recent_res.scalars().all()

    # Günlük gelir (hızlı)
    rev_res = await db.execute(
        select(func.sum(Booking.price_snapshot), func.count(Booking.id))
        .where(Booking.created_at >= day_start)
        .where(Booking.status == BookingStatus.CONFIRMED)
    )
    row = rev_res.one()
    today_rev   = float(row[0] or 0)
    today_count = int(row[1] or 0)

    # Churn count (60+ gün)
    churn_res = await db.execute(
        select(func.count(Customer.id))
        .where(Customer.last_visit <= now - timedelta(days=60))
    )
    churn_count = int(churn_res.scalar() or 0)

    return {
        "type": "LIVE_POLL_SNAPSHOT",
        "timestamp": now.isoformat(),
        "today_revenue": today_rev,
        "today_bookings": today_count,
        "churn_alerts": churn_count,
        "recent_bookings": [
            {
                "price": float(b.price_snapshot or 0),
                "time": b.created_at.strftime("%H:%M") if b.created_at else "—",
                "status": b.status.value if hasattr(b.status, 'value') else str(b.status)
            }
            for b in recent
        ]
    }


# 📌 7️⃣ Run Config
if __name__ == "__main__":
    # HOT RELOAD TRIGGER FOR .ENV SYNC - V17.1
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)






