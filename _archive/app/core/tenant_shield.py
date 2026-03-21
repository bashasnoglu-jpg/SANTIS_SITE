import uuid
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("santis_shield")

class SovereignTenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Generate Correlation DNA (OTEL Full-Stack Tracing)
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        path = request.url.path
        
        # 2. Hard 403 Firewall for Global Admin Routes
        # Whitelist: login + local read-only admin endpoints (no external tenant needed)
        ADMIN_BYPASS = [
            "/api/v1/admin/login",
            "/api/v1/admin/bookings",   # bookings.html feed
            "/api/v1/admin/services",   # services read
        ]
        if path.startswith("/api/v1/admin") and path not in ADMIN_BYPASS:
            tenant_id = request.headers.get("X-Tenant-ID")
            token = request.cookies.get("santis_session") or request.headers.get("Authorization")
            
            # Enforce 403 if totally anonymous or missing tenant for specific operational routes
            if not token and not tenant_id:
                logger.warning(f"[SHIELD] Blocked lateral admin access. Path: {path} | CID: {correlation_id}")
                return JSONResponse(
                    status_code=403, 
                    content={
                        "detail": "Sovereign Shield: Tenant identity or Token missing. Access Denied.", 
                        "correlation_id": correlation_id
                    }
                )

        # 3. Process Request Pipeline
        response = await call_next(request)
        
        # 4. Attach Correlation DNA to external Response headers for Sentry mapping
        response.headers["X-Correlation-ID"] = correlation_id
        
        return response
