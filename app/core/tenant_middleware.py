from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.db.session import AsyncSessionLocal
from app.db.models.tenant import Tenant
from sqlalchemy import select

class TenantResolverMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Sovereign OS: Domain-Driven Tenant Resolver
        Gelen isteğin Host veya Header bilgisine göre işlem yapılacak Tenant'ı belirler.
        """
        # --- PERFORMANS ZIRHI: Statik Dosyaları ve Frontend'i Veritabanı Gecikmesinden Koru ---
        path = request.url.path
        if (path.startswith("/assets/") or path.startswith("/data/") or 
            path.startswith("/tr/") or path.startswith("/en/") or 
            path.startswith("/components/") or 
            path.endswith(".ico") or path.endswith(".json") or path.endswith(".html") or path == "/"):
            return await call_next(request)

        # 1. Header Kontrolü (Geliştirme / API Testleri için öncelikli)
        tenant_domain = request.headers.get("X-Tenant-Domain")
        if not tenant_domain:
            # 2. Host (Domain) Tespiti (Örn: zenith-resort.com, api.santis-club.com)
            host = request.headers.get("host", "").split(":")[0]  # portu at
            tenant_domain = host

        # 3. Veritabanından Tenant'ı Çözümle
        async with AsyncSessionLocal() as db:
            # Domain eşleşmesi ara (İleride cache'lenecek: Redis)
            stmt = select(Tenant).where(Tenant.domain == tenant_domain, Tenant.is_active == True)
            res = await db.execute(stmt)
            tenant = res.scalar_one_or_none()

            if not tenant:
                # Fallback: Santis HQ (Eğer domain bulunamazsa varsayılan ana tenant'a düş)
                fallback_stmt = select(Tenant).where(Tenant.is_active == True).limit(1)
                fallback_res = await db.execute(fallback_stmt)
                tenant = fallback_res.scalar_one_or_none()

            # 4. Request State'e Mühürle
            if tenant:
                # FastAPI request.state objesine tenant id'sini işliyoruz.
                # Bundan sonraki tüm endpointler db sorgularında request.state.tenant_id kullanacak.
                request.state.tenant_id = getattr(tenant.id, "hex", str(tenant.id))
                request.state.tenant_domain = getattr(tenant, "domain", "unknown")
            else:
                request.state.tenant_id = "UNKNOWN_TENANT"
                request.state.tenant_domain = "UNKNOWN_DOMAIN"

        # 5. İsteği Sonraki Katmana (Endpoint'e) İlet
        response = await call_next(request)
        
        # Ek Güvenlik: Response Header'ına Tenant mühürü eklenebilir (İsteğe bağlı)
        # response.headers["X-Sovereign-Tenant"] = request.state.tenant_domain
        
        return response
