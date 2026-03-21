"""
╔══════════════════════════════════════════════════════════════╗
║  🚀 SANTIS OS API — FastAPI Giriş Noktası (main.py)        ║
║  CORS · SlowAPI Rate Limit · Lifespan · Health Check       ║
║  Başlatma: uvicorn app.main:app --host 0.0.0.0 --port 8000 ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Prometheus ─────────────────────────────────────────────────────────────
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    _PROMETHEUS = True
except ImportError:
    _PROMETHEUS = False
    print("[main] ⚠️  prometheus-fastapi-instrumentator yüklü değil — pip install prometheus-fastapi-instrumentator")

# ── Rate Limiting (SlowAPI) ───────────────────────────────────────────────────
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    _SLOWAPI = True
except ImportError:
    _SLOWAPI = False
    print("[main] ⚠️  slowapi yüklü değil — pip install slowapi")

# ── Router ────────────────────────────────────────────────────────────────────
from app.api.v1.router import api_v1_router

# ── Config (env'den) ──────────────────────────────────────────────────────────
_CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:8080,http://localhost:3000,https://santis-club.com,https://www.santis-club.com",
    ).split(",")
    if o.strip()
]
_APP_ENV = os.getenv("APP_ENV", "development")
_VERSION = "1.0.0"

# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlangıç ve bitiş kancaları."""
    # ── Startup ──────────────────────────────────────────────────────────────
    print(f"[Santis OS] 🚀 API başlatılıyor — env={_APP_ENV}, version={_VERSION}")

    # Redis bağlantısını test et (isteğe bağlı)
    redis_url = os.getenv("REDIS_URL", "redis://cache:6379/1")
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(redis_url, socket_connect_timeout=2)
        await r.ping()
        await r.close()
        print(f"[Santis OS] ✅ Redis bağlantısı başarılı: {redis_url}")
    except Exception as e:
        print(f"[Santis OS] ⚠️  Redis bağlantısı kurulamadı: {e} → BullMQ push devre dışı")

    yield  # ← uygulama burada çalışıyor

    # ── Shutdown ──────────────────────────────────────────────────────────────
    print("[Santis OS] 🛑 API kapatılıyor...")


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Santis OS API",
    version=_VERSION,
    description=(
        "Santis Club Spa & Wellness — Rezervasyon, CRM ve İşletme Yönetim API'si. "
        "Public endpoint: POST /api/v1/public/reservation (auth-free, rate-limited)"
    ),
    docs_url    = "/api/docs"     if _APP_ENV != "production" else None,
    redoc_url   = "/api/redoc"    if _APP_ENV != "production" else None,
    openapi_url = "/api/openapi.json" if _APP_ENV != "production" else None,
    lifespan    = lifespan,
)

# ── Prometheus Instrumentator ─────────────────────────────────────────────────
if _PROMETHEUS:
    (
        Instrumentator(
            should_group_status_codes=True,      # 2xx/3xx/4xx/5xx grupla
            should_ignore_untemplated=True,       # /metrics gibi raw path'leri sayma
            should_respect_env_var=True,          # ENABLE_METRICS=false ile kapat
            should_instrument_requests_inprogress=True,
            excluded_handlers=["/metrics", "/api/ping", "/api/health"],
            body_handlers=[],                     # body size metriği şu an kapat
        )
        .instrument(app)
        .expose(app, endpoint="/metrics", include_in_schema=False)
    )
    print("[Santis OS] ✅ Prometheus /metrics endpoint aktif")

# ── SlowAPI Rate Limiter ───────────────────────────────────────────────────────
if _SLOWAPI:
    limiter = Limiter(
        key_func   = get_remote_address,
        default_limits = ["200/hour"],  # Global varsayılan (public endpoint: 5/saat)
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    print("[Santis OS] ✅ SlowAPI rate limiter aktif")

# ── CORS Middleware ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins      = _CORS_ORIGINS,
    allow_credentials  = True,
    allow_methods      = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers      = ["*"],
    expose_headers     = ["X-Request-ID", "X-RateLimit-Remaining"],
    max_age            = 3600,
)

# ── API v1 Router ─────────────────────────────────────────────────────────────
app.include_router(api_v1_router, prefix="/api/v1")

# ── Health Endpoints ──────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"], summary="Sistem Sağlık Kontrolü")
async def health_check() -> dict:
    """Docker healthcheck ve uptime monitor için."""
    return {
        "status":  "ok",
        "version": _VERSION,
        "env":     _APP_ENV,
        "service": "santis-os-api",
    }

@app.get("/api/ping", include_in_schema=False)
async def ping() -> dict:
    return {"pong": True}

# ── 404 Handler ───────────────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc) -> JSONResponse:
    return JSONResponse(
        status_code = 404,
        content     = {
            "error":   "endpoint_not_found",
            "path":    str(request.url.path),
            "message": "Bu endpoint mevcut değil. /api/docs sayfasını inceleyin.",
        },
    )

# ── 500 Handler ───────────────────────────────────────────────────────────────
@app.exception_handler(500)
async def server_error_handler(request: Request, exc) -> JSONResponse:
    import traceback
    if _APP_ENV != "production":
        detail = traceback.format_exc()
    else:
        detail = "Sunucu hatası. Lütfen daha sonra tekrar deneyin."

    return JSONResponse(
        status_code = 500,
        content     = {"error": "internal_server_error", "detail": detail},
    )
