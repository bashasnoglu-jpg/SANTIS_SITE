import ast
import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

# 1. Update imports
source = source.replace('from app.api.v1.endpoints import auth', 'from app.api.v1.endpoints import session_auth\nfrom app.api.v1.endpoints import auth')

# 2. Update router
source = source.replace('app.include_router(\n    auth.router,', 'app.include_router(\n    session_auth.router,')

# 3. Inject CSRF Middleware
middleware_code = """
# ── SOVEREIGN SHIELD PHASE OMEGA: CSRF MIDDLEWARE ────────
from fastapi.responses import JSONResponse
@app.middleware("http")
async def csrf_shield_middleware(request: Request, call_next):
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/v1/auth/login") and not request.url.path.startswith("/api/v1/auth/promo"):
            cookie = request.cookies.get("santis_csrf")
            header = request.headers.get("x-csrf-token")
            # Enforce CSRF ONLY if the user is using Cookie Auth (santis_session) 
            # If they use Bearer token (M2M / Mobile), CSRF is not required
            if request.cookies.get("santis_session"):
                if not cookie or not header or cookie != header:
                    # security_logger logging handled at deps level, but we block here
                    from app.core.security_logger import security_logger
                    security_logger.log_event("CSRF_BLOCKED", "CRITICAL", request.client.host if request.client else "unknown", "unknown", f"CSRF violation on {request.url.path}")
                    return JSONResponse(status_code=403, content={"detail": "Sovereign Shield: CSRF Token missing or mismatch (Double-Submit failure)."})
                    
    response = await call_next(request)
    return response

"""

# Insert middleware after global_audit_middleware
source = source.replace('app.add_middleware(GlobalAuditMiddleware)', 'app.add_middleware(GlobalAuditMiddleware)\n' + middleware_code)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("server.py updated with CSRF Middleware and session_auth router.")
