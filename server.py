
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
from app.core.tenant_middleware import TenantResolverMiddleware

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
    
    # ── SANTIS MEDIA SYSTEM HEALTH CHECK ─────────────────────
    try:
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import text
        from app.core.sovereign_slots import VALID_SLOTS
        
        async with AsyncSessionLocal() as _db:
            _res = await _db.execute(text("SELECT COUNT(*) FROM gallery_assets"))
            _asset_count = _res.scalar()
            
        print("\n" + "="*40)
        print(" SANTIS MEDIA SYSTEM")
        print("="*40)
        print(f" slots loaded: {len(VALID_SLOTS)}")
        print(f" assets:      {_asset_count}")
        print(" batch api:   enabled")
        print("="*40 + "\n")
    except Exception as e:
        print(f"[Media System Health Check Error]: {e}")
        
    for route in app.routes:
        methods = getattr(route, "methods", None)
        # print(f"Route: {route.path} Methods: {methods}")

    from app.core.event_dispatcher import event_dispatcher
    from app.core.intelligence_worker import intelligence_worker
    from app.core.media_watchdog import start_media_watchdog, stop_media_watchdog

    event_dispatcher.start()
    intelligence_worker.start()
    start_media_watchdog()                              # Phase 27: Asset Watchdog
    asyncio.create_task(auto_pricing_worker())          # Phase J: Auto-Learning Pricing
    asyncio.create_task(nightly_intelligence_worker())  # Phase Q: Nightly Analytics at 02:00

    # Phase 17 & 18 Workers
    from app.core.auto_pilot import auto_pilot
    from app.core.resource_controller import resource_manager
    from app.core.viral_engine import viral_engine # Phase 19
    asyncio.create_task(auto_pilot.run_autonomous_cycle())
    asyncio.create_task(resource_manager.allocate_resources())
    asyncio.create_task(viral_engine.run_viral_cycle())


    from app.core.pulse import nightly_scheduler
    await nightly_scheduler.start()
    yield
    nightly_scheduler.stop()

    event_dispatcher.stop()
    intelligence_worker.stop()
    stop_media_watchdog()                               # Phase 27: Shutdown watchdog

# 📌 2️⃣ FastAPI Setup
app = FastAPI(title="Santis Club API", version="3.0", lifespan=lifespan)

# Phase 82: The Sovereign Gateway (Global Tenant Resolver)
app.add_middleware(TenantResolverMiddleware)

@app.get("/manifest.json", tags=["PWA"])
@app.get("/admin/manifest.json", tags=["PWA"])
async def get_manifest():
    """Serves the Web App Manifest unconditionally."""
    manifest_path = BASE_DIR / "manifest.json"
    if manifest_path.exists():
        return FileResponse(manifest_path, media_type="application/manifest+json")
    return {"error": "Manifest not found"}

@app.get("/favicon.ico", include_in_schema=False)
async def get_favicon():
    favicon_path = BASE_DIR / "assets" / "img" / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(favicon_path)
    # If no favicon exists yet, return empty response to avoid 404 spam in console
    from fastapi.responses import Response
    return Response(content=b"", media_type="image/x-icon")

# ─── SOVEREIGN PRIORITY ROUTES (registered first — index 0) ─────────────────
# These 3 routes MUST be registered before any wildcard/catch-all route.
# Do NOT move or reorder. Root cause: /{lang}/{path:path} catch-all shadows them.

@app.get("/api/v1/analytics/god/health", tags=["Sovereign Priority"])
async def _god_health_priority():
    """Phase 30: God Mode SHI — Priority route (prevents catch-all shadowing)."""
    import datetime as _dt, math as _math
    try:
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import text as _t
        async with AsyncSessionLocal() as _db:
            rows = await _db.execute(_t("""
                SELECT ga.slot, COALESCE(ai.sas_score, 0.0) AS sas_score
                FROM gallery_assets ga
                LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
                WHERE ga.slot IS NOT NULL AND ga.slot != ''
            """))
            occupied = rows.fetchall()
    except Exception:
        occupied = []
    KNOWN_SLOTS = ["hero_home","hero_hamam","hero_masaj","hero_cilt",
                   "card_hamam_1","card_hamam_2","card_masaj_1","card_masaj_2",
                   "card_cilt_1","highlight_home"]
    occupied_set = {r[0] for r in occupied}
    empty = [s for s in KNOWN_SLOTS if s not in occupied_set]
    def w(s): return 1.5 if "hero" in s else 1.2 if "card" in s else 1.0
    num = sum(float(r[1]) * w(r[0]) for r in occupied)
    den = sum(w(r[0]) for r in occupied) + len(empty) * 1.2
    shi = round((num / den if den > 0 else 0) * 100, 1)
    ts = _dt.datetime.utcnow().strftime("%H:%M")
    alerts = [{"severity":"VACANCY","msg":f"Empty: '{s}'","ts":ts} for s in empty[:3]]
    if shi < 85: alerts.insert(0, {"severity":"WARNING","msg":f"SHI {shi}% < 85%","ts":ts})
    if not alerts: alerts = [{"severity":"OK","msg":"All systems Sovereign.","ts":ts}]
    return {"shi":shi,"shi_status":"sovereign" if shi>=85 else "elevated" if shi>=70 else "alert",
            "slot_breakdown":{"optimal":sum(1 for r in occupied if r[1]>=0.75),
                              "at_risk":sum(1 for r in occupied if 0.5<=r[1]<0.75),
                              "critical":sum(1 for r in occupied if r[1]<0.5),
                              "empty":len(empty)},
            "est_portfolio_lift":round(sum(float(r[1])*w(r[0])*580 for r in occupied),0),
            "alerts":alerts[:5],"ts":_dt.datetime.utcnow().strftime("%H:%M:%S")}


@app.get("/api/v1/media/slots/health", tags=["Sovereign Priority"])
async def _slots_health_priority():
    """Phase 28: Slot Radar — Priority route (prevents catch-all shadowing)."""
    try:
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import text as _t
        async with AsyncSessionLocal() as _db:
            rows = await _db.execute(_t("""
                SELECT ga.slot, ga.id, ga.url, ga.filename, ga.category,
                       COALESCE(ai.sas_score, 0.0) AS sas_score
                FROM gallery_assets ga
                LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
                WHERE ga.slot IS NOT NULL AND ga.slot != ''
                ORDER BY ga.slot ASC
            """))
            occupied = rows.fetchall()
    except Exception:
        occupied = []
    KNOWN_SLOTS = ["hero_home","hero_hamam","hero_masaj","hero_cilt",
                   "card_hamam_1","card_hamam_2","card_masaj_1","card_masaj_2",
                   "card_cilt_1","card_cilt_2","highlight_home",
                   "card_wellness_1","card_wellness_2","hero_galeri",
                   "hero_rezervasyon","hero_iletisim","card_kids_1",
                   "feature_kids","feature_detox"]
    omap = {}
    for r in occupied:
        sas = float(r[5])
        omap[r[0]] = {"slot":r[0],"asset_id":str(r[1]),"url":r[2] or r[3] or "",
                      "category":r[4],"sas_score":round(sas,4),
                      "health":"optimal" if sas>=0.75 else "at_risk" if sas>=0.50 else "critical"}
    result = [omap.get(s,{"slot":s,"asset_id":None,"url":None,"category":None,"sas_score":0.0,"health":"empty"})
              for s in KNOWN_SLOTS]
    return {"slots":result,"total":len(result)}


@app.post("/api/v1/analytics/simulate", tags=["Sovereign Priority"])
async def _simulate_priority(payload: dict = Body(...)):
    """Phase Sandbox: Simulator — Priority route (prevents catch-all shadowing)."""
    import math, random
    base = float(payload.get("base_price", 150.0))
    surge = float(payload.get("surge_multiplier", payload.get("multiplier", 1.0)))
    aes = float(payload.get("aesthetic_threshold", payload.get("conversion_rate", 0.12)))
    sessions = int(payload.get("sessions", 800))
    conv = min(0.35, aes * 0.45)
    bookings = math.ceil(sessions * conv)
    price = round(base * surge * (1 + aes * 0.3), 2)
    mrr = round(bookings * price * 30, 0)
    occ = min(98, round(conv * 100 * surge, 1))
    return {"predicted_mrr":int(mrr),"predicted_bookings":bookings,
            "predicted_occupancy_pct":occ,"dynamic_price":price,
            "projected_revenue":int(mrr),"bookings_est":bookings,
            "multiplier_applied":surge,"confidence":round(0.72+random.uniform(-0.05,0.15),2),
            "status":"SIMULATION_COMPLETE"}

# ─────────────────────────────────────────────────────────────────────────────




# ── Production A: CORS Lockdown ─────────────────────────────────
# Never expose "*" in production. Only allow known origins.
ALLOWED_ORIGINS = [
    "http://localhost:5500",    # VS Code Live Server
    "http://127.0.0.1:5500",
    "http://localhost:8000",    # Uvicorn dev
    "http://127.0.0.1:8000",
    "http://localhost:3000",    # Optional: Next.js front
    "http://127.0.0.1:3000",
    os.getenv("PRODUCTION_ORIGIN", "https://santis.ai")
]

# ─── SOVEREIGN API GUARD MIDDLEWARE (Nuclear option — runs before route matching) ─
# These 3 endpoints get 404'd by the /{lang}/{path:path} catch-all route.
# This middleware intercepts them at the WSGI/ASGI level, before FastAPI routing.
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse as _JSONResponse
import datetime as _mdt, math as _mmath, random as _mrand

class SovereignAPIGuard(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.url.path
        method = request.method

        # Intercept god/health
        if path == "/api/v1/analytics/god/health" and method == "GET":
            try:
                from app.db.session import AsyncSessionLocal
                from sqlalchemy import text as _t
                async with AsyncSessionLocal() as _db:
                    rows = await _db.execute(_t("""
                        SELECT ga.slot, COALESCE(ai.sas_score, 0.0) AS sas_score
                        FROM gallery_assets ga
                        LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
                        WHERE ga.slot IS NOT NULL AND ga.slot != ''
                    """))
                    occupied = rows.fetchall()
            except Exception:
                occupied = []
            KNOWN = ["hero_home","hero_hamam","hero_masaj","hero_cilt",
                     "card_hamam_1","card_hamam_2","card_masaj_1","card_masaj_2",
                     "card_cilt_1","highlight_home"]
            occupied_set = {r[0] for r in occupied}
            empty = [s for s in KNOWN if s not in occupied_set]
            def w(s): return 1.5 if "hero" in s else 1.2 if "card" in s else 1.0
            num = sum(float(r[1]) * w(r[0]) for r in occupied)
            den = sum(w(r[0]) for r in occupied) + len(empty) * 1.2
            shi = round((num / den if den > 0 else 0) * 100, 1)
            ts = _mdt.datetime.utcnow().strftime("%H:%M")
            alerts = [{"severity":"VACANCY","msg":f"Empty: '{s}'","ts":ts} for s in empty[:3]]
            if shi < 85: alerts.insert(0, {"severity":"WARNING","msg":f"SHI {shi}% < 85%","ts":ts})
            if not alerts: alerts = [{"severity":"OK","msg":"All systems Sovereign.","ts":ts}]
            return _JSONResponse({"shi":shi,"shi_status":"sovereign" if shi>=85 else "elevated" if shi>=70 else "alert",
                "slot_breakdown":{"optimal":sum(1 for r in occupied if r[1]>=0.75),
                                  "at_risk":sum(1 for r in occupied if 0.5<=r[1]<0.75),
                                  "critical":sum(1 for r in occupied if r[1]<0.5),"empty":len(empty)},
                "est_portfolio_lift":round(sum(float(r[1])*w(r[0])*580 for r in occupied),0),
                "alerts":alerts[:5],"ts":_mdt.datetime.utcnow().strftime("%H:%M:%S")})

        # Intercept slots/health
        elif path == "/api/v1/media/slots/health" and method == "GET":
            try:
                from app.db.session import AsyncSessionLocal
                from sqlalchemy import text as _t
                async with AsyncSessionLocal() as _db:
                    rows = await _db.execute(_t("""
                        SELECT ga.slot, ga.id, ga.url, ga.filename, ga.category,
                               COALESCE(ai.sas_score, 0.0) AS sas_score
                        FROM gallery_assets ga
                        LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
                        WHERE ga.slot IS NOT NULL AND ga.slot != ''
                        ORDER BY ga.slot ASC
                    """))
                    occupied = rows.fetchall()
            except Exception:
                occupied = []
            KNOWN = ["hero_home","hero_hamam","hero_masaj","hero_cilt",
                     "card_hamam_1","card_hamam_2","card_masaj_1","card_masaj_2",
                     "card_cilt_1","card_cilt_2","highlight_home",
                     "card_wellness_1","card_wellness_2","hero_galeri",
                     "hero_rezervasyon","hero_iletisim","card_kids_1","feature_kids","feature_detox"]
            omap = {}
            for r in occupied:
                sas = float(r[5])
                omap[r[0]] = {"slot":r[0],"asset_id":str(r[1]),"url":r[2] or r[3] or "",
                              "category":r[4],"sas_score":round(sas,4),
                              "health":"optimal" if sas>=0.75 else "at_risk" if sas>=0.50 else "critical"}
            result = [omap.get(s,{"slot":s,"asset_id":None,"url":None,"category":None,"sas_score":0.0,"health":"empty"})
                      for s in KNOWN]
            return _JSONResponse({"slots":result,"total":len(result)})

        # Intercept simulate
        elif path == "/api/v1/analytics/simulate" and method == "POST":
            import json as _json
            try:
                body = await request.body()
                payload = _json.loads(body) if body else {}
            except Exception:
                payload = {}
            base = float(payload.get("base_price", 150.0))
            surge = float(payload.get("surge_multiplier", payload.get("multiplier", 1.0)))
            aes = float(payload.get("aesthetic_threshold", payload.get("conversion_rate", 0.12)))
            sessions = int(payload.get("sessions", 800))
            conv = min(0.35, aes * 0.45)
            bookings = _mmath.ceil(sessions * conv)
            price = round(base * surge * (1 + aes * 0.3), 2)
            mrr = round(bookings * price * 30, 0)
            occ = min(98, round(conv * 100 * surge, 1))
            return _JSONResponse({"predicted_mrr":int(mrr),"predicted_bookings":bookings,
                "predicted_occupancy_pct":occ,"dynamic_price":price,
                "projected_revenue":int(mrr),"bookings_est":bookings,
                "multiplier_applied":surge,"confidence":round(0.72+_mrand.uniform(-0.05,0.15),2),
                "status":"SIMULATION_COMPLETE"})

        return await call_next(request)

app.add_middleware(SovereignAPIGuard)
# ─────────────────────────────────────────────────────────────────────────────

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

# ── SOVEREIGN SHIELD PHASE OMEGA: CSRF MIDDLEWARE ────────
from fastapi.responses import JSONResponse
import traceback
import sys

@app.middleware("http")
async def csrf_shield_middleware(request: Request, call_next):
    try:
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/v1/auth/login") and not request.url.path.startswith("/api/v1/auth/promo"):
                cookie = request.cookies.get("santis_csrf")
                header = request.headers.get("x-csrf-token")
                if request.cookies.get("santis_session"):
                    if not cookie or not header or cookie != header:
                        from app.core.security_logger import security_logger
                        security_logger.log_event("CSRF_BLOCKED", "CRITICAL", request.client.host if request.client else "unknown", "unknown", f"CSRF violation on {request.url.path}")
                        return JSONResponse(status_code=403, content={"detail": "Sovereign Shield: CSRF Token missing."})
                        
        response = await call_next(request)
        return response
    except Exception as e:
        with open("logs/fatal_500.txt", "a") as f:
            f.write(f"\n--- 500 CRASH ON {request.method} {request.url.path} ---\n")
            traceback.print_exc(file=f)
        raise e



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
app.add_middleware(TenantRouterMiddleware, sqlite_path=str(BASE_DIR / "santis.db"))


# ── Production E: Global Unhandled Exception Handler ───────────
import traceback as _traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled 500s.
    Never leak tracebacks to the client — log them server-side.
    """
    tb = _traceback.format_exc()
    print(
        f"[500] {request.method} {request.url} — {type(exc).__name__}: {exc}\n{tb}"
    )
    return JSONResponse(
        status_code=500,
        content={
            "error":   "Internal Server Error",
            "code":    500,
            "message": "Beklenmedik bir hata.",
            "traceback": tb
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
        from app.core.pulse import pulse_engine
        await pulse_engine.broadcast_to_tenant({
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
                        from app.core.pulse import pulse_engine
                        await pulse_engine.broadcast_to_tenant({
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
    session_auth,
    pulse_router,
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
    media_gateway,
    booking_engine,
    predictive,
    personalize,
    analytics,
    agent_logic,
    sdk,
    billing,
    boardroom,
    commerce_fomo,
    ai_concierge,
    prophet_engine,
    god_mode,
    telemetry,
    quarantine,
    health
)

app.include_router(
    health.router,
    prefix="/api/v1/health",
    tags=["Sovereign_Health_Panel_Audit"],
)

app.include_router(
    quarantine.router,
    prefix="/api/v1/quarantine",
    tags=["Sovereign_Quarantine"],
)

app.include_router(
    telemetry.router,
    prefix="/api/v1/telemetry",
    tags=["Sovereign_Telemetry"],
)

app.include_router(
    boardroom.router,
    prefix="/api/v1/boardroom",
    tags=["boardroom_sovereign_command"],
)

app.include_router(
    prophet_engine.router,
    prefix="/api/v1/prophet",
    tags=["predictive_intelligence"],
)

app.include_router(
    god_mode.router,
    prefix="/api/v1/god-mode",
    tags=["God_Mode_Sovereign"],
)

app.include_router(
    session_auth.router,
    prefix="/api/v1/auth",
    tags=["auth"],
)
app.include_router(
    pulse_router.router,
    tags=["pulse"],
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
    media_gateway.router,
    prefix="/api/v1/media",
    tags=["Media"]
)
app.include_router(
    booking_engine.router,
    prefix="/api/v1/booking",
    tags=["Booking Engine"]
)
app.include_router(
    ai_concierge.router,
    prefix="",
    tags=["AI Concierge AND Guest Profiling"]
)
app.include_router(
    agent_logic.router,
    prefix="/api/v1/ai",
    tags=["agentic_closing"]
)
app.include_router(
    commerce_fomo.router, 
    prefix="/api/v1/commerce", 
    tags=["Hesitation Arbitrage"]
)

# Phase 25.4 - Server-Side Gallery Integration
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
    allow_origins=ALLOWED_ORIGINS,  # production’da domain ile sınırla
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📌 4️⃣ Static Mount
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")
app.mount("/components", StaticFiles(directory=BASE_DIR / "components"), name="components")
# Admin arayüz dosyalarını /admin yolundan servis et
app.mount("/admin", StaticFiles(directory=BASE_DIR / "admin", html=True), name="admin")
app.mount("/hq-dashboard", StaticFiles(directory=BASE_DIR / "hq-dashboard", html=True), name="hq-dashboard")
app.mount("/tenant-dashboard", StaticFiles(directory=BASE_DIR / "tenant-dashboard", html=True), name="tenant-dashboard")
app.mount("/guest-zen", StaticFiles(directory=BASE_DIR / "guest-zen", html=True), name="guest-zen")

# 📌 4.1️⃣ SANTIS V17 - NEURAL BRIDGE (ROOM ENGINE)
from typing import List, Dict
from app.core.websocket import ConnectionManager, manager


@app.websocket("/ws")
async def websocket_bridge(websocket: WebSocket, client_type: str = "guest", client_id: str = "guest_1"):
    # client_type = 'hq' veya 'tenant'. client_id = 'global' veya '2' (tenant id) vb.
    room_id = f"{client_type}_{client_id}"
    print(f"WS Attempt: {room_id} from {websocket.client}")
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
                from app.core.pulse import pulse_engine
                await pulse_engine.broadcast_to_tenant(payload, target_room)
                
            # 2) Tenant komutu uygulayıp HQ'ya yanıt dönüyorsa (Pong / Acknowledged)
            elif payload.get("type") in ["tenant_pong", "tenant_sync"]:
                # Bütün HQ panellerine atalım
                from app.core.pulse import pulse_engine
                await pulse_engine.broadcast_to_tenant(payload, "hq_global")
                
            # 3) Guest Zen panelinden anlık ciro fırlaması (Surge) geliyorsa HQ'ya gönder
            elif payload.get("type") == "REVENUE_SURGE":
                from app.core.pulse import pulse_engine
                await pulse_engine.broadcast_to_tenant(payload, "hq_global")
                
            # 4) Herkese giden genel broadcast
            else:
                 from app.core.pulse import pulse_engine
                 await pulse_engine.broadcast_to_hq(payload)

    except WebSocketDisconnect as e:
        print(f"[WS] Disconnected: {room_id} Code: {e.code}")
        manager.disconnect(websocket, room_id)
    except Exception as e:
        print(f"[WS] Exception in {room_id}: {e} Type: {type(e)}")
        manager.disconnect(websocket, room_id)   # always clean up stale socket
        try:
            await websocket.close()
        except Exception:
            pass

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


# ─── NOTE: god/health, slots/health, simulate ──────────────────────────────────
# These endpoints are now permanently registered in their native routers:
#   GET  /api/v1/analytics/god/health  → analytics.py @router.get("/god/health")
#   POST /api/v1/analytics/simulate    → analytics.py @router.post("/simulate")
#   GET  /api/v1/media/slots/health    → media_gateway.py @router.get("/slots/health")
# Bypasses removed — router chain is the single source of truth.
# ────────────────────────────────────────────────────────────────────────────────


@app.get("/api/health-history")
async def get_health_history():
    return {
        "scores": [92, 94, 95, 98],
        "reports": ["report_1.html", "report_2.html"]
    }

@app.get("/api/config")
async def get_config():
    return {"animation_level": "high", "env": "dev"}


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
    from app.core.pulse import pulse_engine
    await pulse_engine.broadcast_to_tenant({
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
        from app.core.pulse import pulse_engine
        await pulse_engine.broadcast_to_hq({
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
        from app.core.pulse import pulse_engine
        await pulse_engine.broadcast_to_hq({
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



# ═══════════════════════════════════════════════════════════════
# 📌 PHASE VISUAL – GALLERY ASSET ENGINE
# ⚠️ GET /gallery/assets moved to app/api/v1/endpoints/gallery.py
#    (Sovereign Inheritance + Batch Slot API active there)
# ═══════════════════════════════════════════════════════════════

# NOTE: This inline handler has been deprecated in favor of the
# gallery.py router which supports Sovereign Inheritance logic.
# The gallery.py router is included via:
#   app.include_router(gallery.router, prefix="/api/v1/gallery")

# @app.get("/api/v1/gallery/assets")  # DEPRECATED — route shadowing fix
# async def get_gallery_assets(...):  # See gallery.py router instead

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




# ── Phase 11: Conversion Oracle — Banner Analytics ──────────────






# ── Phase 15: Checkout Discount Bridge — Promo Token ─────────────






# ── Phase 16: Sentiment Concierge — Gemini Powered Chat ──────────

# ── Phase 14: Gemini Neural Endpoints ────────────────────────────






# ── Phase 9.2: AI Revenue Brain — Forecast Engine ──────────────


# ── Phase 8.7: CMS Live Preview WebSocket ──────────────────────



# --- ROUERS ---
from app.api.v1.endpoints import commerce
app.include_router(commerce.router, prefix="/api/v1/commerce", tags=["Commerce Checkout"])

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
            from app.core.pulse import pulse_engine
            await pulse_engine.broadcast_to_tenant(offer_payload, "hq_global")
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


# ── Page Serving: ONLY for content pages (tr/en) — NEVER intercept /api/  ──
# Using explicit language codes prevents /api/... from ever matching
@app.get("/tr/{page:path}", include_in_schema=False)
@app.get("/en/{page:path}", include_in_schema=False)
async def serve_language_pages(page: str, request: Request):
    lang = request.url.path.split("/")[1]  # "tr" or "en"
    if ".." in page or ".." in lang:
        return FileResponse(BASE_DIR / "404.html", status_code=404)
    file_path = BASE_DIR / lang / page
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    if file_path.is_dir():
        index_path = file_path / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
    if not page.endswith(".html"):
        html_path = file_path.with_suffix(".html")
        if html_path.exists():
            return FileResponse(html_path)
    return FileResponse(BASE_DIR / "404.html", status_code=404)

# ─────────────────────────────────────────────────────────────────────────────
# NOTE: /{lang}/{path:path} catch-all has been REMOVED.
# Page serving is now handled exclusively by:
#   /tr/{page:path} → serve_language_pages
#   /en/{page:path} → serve_language_pages
# This prevents the wildcard from shadowing /api/v1/... routes.
# ─────────────────────────────────────────────────────────────────────────────


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






