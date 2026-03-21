"""
╔══════════════════════════════════════════════════════════════╗
║  🗺️ SANTIS API v1 — Router Registry                       ║
║  Tüm v1 endpoint router'larını tek noktada toplar          ║
║  FastAPI app'e: app.include_router(api_v1_router)          ║
╚══════════════════════════════════════════════════════════════╝

app entry point'ten (server.py / main.py) kullanımı:
    from app.api.v1.router import api_v1_router
    app.include_router(api_v1_router, prefix="/api/v1")
"""
from fastapi import APIRouter

# ── Auth ──────────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import session_auth

# ── Core Booking ──────────────────────────────────────────────────────────────
from app.api.v1.endpoints import bookings

# ── 🌐 Public (auth-free) ─────────────────────────────────────────────────────
from app.api.v1.endpoints import public_reservation

# ── Hizmetler ─────────────────────────────────────────────────────────────────
from app.api.v1.endpoints import services

# ── CRM & Müşteri ─────────────────────────────────────────────────────────────
from app.api.v1.endpoints import guests, crm

# ── Analitik & Gelir ──────────────────────────────────────────────────────────
from app.api.v1.endpoints import analytics, revenue

# ── Canlı Stream ──────────────────────────────────────────────────────────────
from app.api.v1.endpoints import pulse_router

# ── Admin & Yönetim ───────────────────────────────────────────────────────────
from app.api.v1.endpoints import admin, users

# ── Opsiyonel / İleri Seviye ──────────────────────────────────────────────────
from app.api.v1.endpoints import health

# ── Yönlendirici (API v1 root) ────────────────────────────────────────────────
api_v1_router = APIRouter()

# ─────────────────────────────────────────────────────────────
#  PUBLIC — Kimlik doğrulaması GEREKTIRMEZ
#  ⚠️  Rate-limited: 5 istek / saat / IP
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    public_reservation.router,
    prefix="/public/reservation",
    tags=["Public"],
)

# ─────────────────────────────────────────────────────────────
#  AUTH
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    session_auth.router,
    prefix="/auth",
    tags=["Auth"],
)

# ─────────────────────────────────────────────────────────────
#  BOOKING ENGINE
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    bookings.router,
    prefix="/bookings",
    tags=["Bookings"],
)
api_v1_router.include_router(
    bookings.legacy_router,
    prefix="/legacy",
    tags=["Legacy"],
)

# ─────────────────────────────────────────────────────────────
#  HİZMETLER
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    services.router,
    prefix="/services",
    tags=["Services"],
)

# ─────────────────────────────────────────────────────────────
#  MÜŞTERİ / CRM
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    guests.router,
    prefix="/guests",
    tags=["Guests"],
)
api_v1_router.include_router(
    crm.router,
    prefix="/crm",
    tags=["CRM"],
)

# ─────────────────────────────────────────────────────────────
#  ANALİTİK & GELİR
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"],
)
api_v1_router.include_router(
    revenue.router,
    prefix="/revenue",
    tags=["Revenue"],
)

# ─────────────────────────────────────────────────────────────
#  CANLÜ STREAM / WebSocket
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    pulse_router.router,
    prefix="/pulse",
    tags=["Pulse"],
)

# ─────────────────────────────────────────────────────────────
#  ADMIN (kısıtlı)
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"],
)
api_v1_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
)

# ─────────────────────────────────────────────────────────────
#  HEALTH
# ─────────────────────────────────────────────────────────────
api_v1_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"],
)
