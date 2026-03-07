"""
app/core/tenant_router.py
Subdomain → Tenant Resolution Middleware

Çözümleme sırası:
  1. X-Tenant-ID header (dev/test override)
  2. Subdomain: santis-istanbul.santis.com → slug = "santis-istanbul"
  3. DB lookup: tenants.name ILIKE :slug (LRU cached 60s)
  4. Fallback: ilk aktif tenant (single-tenant geriye dönük uyumluluk)

request.state.tenant_id  → str UUID
request.state.tenant_slug → str
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("TenantRouter")

# ── TTL Cache (slug → (tenant_id | "", expires_at)) ──────────────────────────
_cache: dict[str, tuple[str, float]] = {}
_CACHE_TTL = 60.0


def _cache_get(slug: str) -> Optional[str]:
    entry = _cache.get(slug)
    if entry and time.monotonic() < entry[1]:
        return entry[0]  # "" = known-miss, truthy str = tenant_id
    return None  # cache miss


def _cache_set(slug: str, tenant_id: str) -> None:
    _cache[slug] = (tenant_id, time.monotonic() + _CACHE_TTL)
    if len(_cache) > 500:
        oldest = min(_cache, key=lambda k: _cache[k][1])
        _cache.pop(oldest, None)


def _extract_slug(host: str) -> str:
    """
    'santis-istanbul.santis.com' → 'santis-istanbul'
    'santis.com'                 → ''  (kök domain)
    'localhost'                  → ''
    'localhost:8000'             → ''
    """
    host = host.split(":")[0].lower()
    parts = host.split(".")
    if len(parts) >= 3 and parts[0] not in ("www", "api", "admin"):
        return parts[0]
    return ""


# ── DB Lookup (asyncpg — PostgreSQL) ─────────────────────────────────────────

async def _resolve_tenant_pg(slug: str, dsn: str) -> Optional[str]:
    """PostgreSQL üzerinden tenant_id çöz."""
    cached = _cache_get(slug)
    if cached is not None:
        return cached or None

    try:
        import asyncpg
        conn = await asyncpg.connect(dsn)
        try:
            row = await conn.fetchrow(
                "SELECT id::text FROM tenants "
                "WHERE LOWER(name) = LOWER($1) AND is_active = true AND is_deleted = false "
                "LIMIT 1",
                slug,
            )
            tenant_id = row["id"] if row else None
            _cache_set(slug, tenant_id or "")
            return tenant_id
        finally:
            await conn.close()
    except Exception as e:
        logger.warning(f"[TenantRouter] DB lookup failed for '{slug}': {e}")
        _cache_set(slug, "")
        return None


async def _fallback_tenant_pg(dsn: str) -> Optional[str]:
    """İlk aktif tenant'ı döndür (single-tenant fallback)."""
    cached = _cache_get("__fallback__")
    if cached is not None:
        return cached or None

    try:
        import asyncpg
        conn = await asyncpg.connect(dsn)
        try:
            row = await conn.fetchrow(
                "SELECT id::text FROM tenants "
                "WHERE is_active = true AND is_deleted = false "
                "ORDER BY created_at ASC LIMIT 1"
            )
            tid = row["id"] if row else None
            _cache_set("__fallback__", tid or "")
            return tid
        finally:
            await conn.close()
    except Exception as e:
        logger.warning(f"[TenantRouter] Fallback lookup failed: {e}")
        return None


# ── SQLite Fallback (local dev olmadan PG yoksa) ──────────────────────────────

async def _resolve_tenant_sqlite(slug: str, db_path: str) -> Optional[str]:
    cached = _cache_get(slug)
    if cached is not None:
        return cached or None
    try:
        import aiosqlite
        async with aiosqlite.connect(db_path) as con:
            cur = await con.execute(
                "SELECT id FROM tenants WHERE LOWER(name) = LOWER(?) AND is_active = 1 LIMIT 1",
                (slug,),
            )
            row = await cur.fetchone()
            tenant_id = str(row[0]) if row else None
            _cache_set(slug, tenant_id or "")
            return tenant_id
    except Exception as e:
        logger.warning(f"[TenantRouter] SQLite lookup failed for '{slug}': {e}")
        _cache_set(slug, "")
        return None


async def _fallback_tenant_sqlite(db_path: str) -> Optional[str]:
    cached = _cache_get("__fallback__")
    if cached is not None:
        return cached or None
    try:
        import aiosqlite
        async with aiosqlite.connect(db_path) as con:
            cur = await con.execute(
                "SELECT id FROM tenants WHERE is_active = 1 ORDER BY rowid LIMIT 1"
            )
            row = await cur.fetchone()
            tid = str(row[0]) if row else None
            _cache_set("__fallback__", tid or "")
            return tid
    except Exception:
        return None


# ── Middleware ─────────────────────────────────────────────────────────────────

class TenantRouterMiddleware(BaseHTTPMiddleware):
    """
    Subdomain → Tenant Resolution Middleware

    Kullanım (server.py içinde):
        from app.core.tenant_router import TenantRouterMiddleware
        app.add_middleware(
            TenantRouterMiddleware,
            pg_dsn=settings.DATABASE_URL_SYNC,  # opsiyonel
            sqlite_path="santis.db",            # fallback
        )

    Her request'ten sonra:
        request.state.tenant_id   → str UUID (boş ise bilinmiyor)
        request.state.tenant_slug → str subdomain
        request.state.is_multitenant → bool
    """

    def __init__(
        self,
        app,
        pg_dsn: Optional[str] = None,
        sqlite_path: str = "santis.db",
    ):
        super().__init__(app)
        # asyncpg için postgresql+asyncpg:// yerine postgresql:// kullan
        self.pg_dsn = pg_dsn.replace("postgresql+asyncpg://", "postgresql://") if pg_dsn else None
        self.sqlite_path = sqlite_path

    async def _resolve(self, slug: str) -> Optional[str]:
        if self.pg_dsn:
            return await _resolve_tenant_pg(slug, self.pg_dsn)
        return await _resolve_tenant_sqlite(slug, self.sqlite_path)

    async def _fallback(self) -> Optional[str]:
        if self.pg_dsn:
            return await _fallback_tenant_pg(self.pg_dsn)
        return await _fallback_tenant_sqlite(self.sqlite_path)

    async def dispatch(self, request: Request, call_next):
        # 1. Dev/Test header override
        override = request.headers.get("X-Tenant-ID", "").strip()
        if override:
            request.state.tenant_id = override
            request.state.tenant_slug = "header-override"
            request.state.is_multitenant = True
            return await call_next(request)

        # 2. Subdomain çıkar
        host = request.headers.get("host", "")
        slug = _extract_slug(host)

        tenant_id: Optional[str] = None
        if slug:
            tenant_id = await self._resolve(slug)

        # 3. Fallback: ilk aktif tenant
        if not tenant_id:
            tenant_id = await self._fallback()
            slug = "default"

        request.state.tenant_id = tenant_id or ""
        request.state.tenant_slug = slug
        request.state.is_multitenant = bool(slug and slug != "default")

        if tenant_id:
            logger.debug(
                f"[TenantRouter] {host} → tenant={tenant_id[:8]}… slug={slug}"
            )
        else:
            logger.debug(f"[TenantRouter] {host} → no tenant resolved")

        return await call_next(request)
