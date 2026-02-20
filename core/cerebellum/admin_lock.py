
import os
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger("SantisSecurity")

# Import Session Manager
try:
    from core.cerebellum.session_manager import session_manager
except ImportError:
    session_manager = None
    logger.warning("⚠️ Session Manager not available")

# Import Admin Audit
try:
    from core.cerebellum.admin_audit import admin_audit
except ImportError:
    admin_audit = None


class AdminLock:
    """
    Control Access to Admin Panel.
    Layers:
    1. Localhost Bypass (Trusted)
    2. Session Auth (Cookie)
    3. Token Auth (Remote/API)
    """
    def __init__(self):
        # Trusted IPs (Localhost)
        self.TRUSTED_IPS = ["127.0.0.1", "localhost", "::1"]
        
        # Fail-fast token loading:
        # preferred: ADMIN_SECRET_TOKEN
        # legacy fallback (migration): SESSION_SECRET
        token = (os.getenv("ADMIN_SECRET_TOKEN") or os.getenv("SESSION_SECRET") or "").strip()
        if not token:
            raise RuntimeError(
                "Missing admin token env. Set ADMIN_SECRET_TOKEN (preferred)."
            )
        if token in ("santis-super-operator-key", "admin", "changeme", "123456") or len(token) < 24:
            raise RuntimeError("Weak admin token detected. Refusing insecure default token.")
        self.ADMIN_TOKEN = token
        if os.getenv("SESSION_SECRET") and not os.getenv("ADMIN_SECRET_TOKEN"):
            logger.warning("⚠️ [AdminLock] Using legacy SESSION_SECRET as admin token. Migrate to ADMIN_SECRET_TOKEN.")

        # Paths that don't require auth (login page itself, static assets)
        self.PUBLIC_PATHS = [
            "/admin/login",
            "/admin/login.html",
        ]

        # Always-protected prefixes (all methods)
        self.ALWAYS_PROTECTED_PREFIXES = (
            "/admin",
            "/api/admin",
            "/api/bridge",
            "/api/pages",
            "/api/fix",
            "/fix",
            "/api/vip",
        )

        # Write-protected prefixes (POST/PUT/DELETE only)
        self.WRITE_PROTECTED_PREFIXES = (
            "/api/config",
            "/api/services",
            "/api/fix",
            "/fix",
            "/api/template-governance",
        )

    def is_authorized(self, request: Request) -> bool:
        """Check if request is authorized to access Admin."""
        ip = request.client.host
        path = request.url.path.lower()

        # 0. Public paths (login page)
        for pub in self.PUBLIC_PATHS:
            if path == pub or path.startswith(pub):
                return True
        
        # 1. Localhost Bypass
        if ip in self.TRUSTED_IPS:
            return True

        # 2. Session Auth (Cookie)
        if session_manager:
            session_token = request.cookies.get(session_manager.COOKIE_NAME)
            if session_token:
                session = session_manager.validate_session(session_token)
                if session:
                    return True
            
        # 3. Token Auth (API / Remote)
        token = request.headers.get("X-ADMIN-TOKEN")
        if token == self.ADMIN_TOKEN:
            return True

        return False

admin_lock_system = AdminLock()

class AdminLockMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        
        path = request.url.path.lower()
        is_write = request.method in ("POST", "PUT", "DELETE")
        needs_auth = (
            path.startswith(admin_lock_system.ALWAYS_PROTECTED_PREFIXES)
            or (is_write and path.startswith(admin_lock_system.WRITE_PROTECTED_PREFIXES))
        )
        
        # Protect admin routes + sensitive API endpoints
        if needs_auth:
            
            # Check Authorization
            if not admin_lock_system.is_authorized(request):
                
                # Log Attempt
                ip = request.client.host
                user_agent = request.headers.get("user-agent", "unknown")
                logger.warning(f"🚫 [ADMIN LOCK] Unauthorized access attempt from {ip} to {path}")
                
                # Audit Log
                if admin_audit:
                    admin_audit.log(
                        action="UNAUTHORIZED_ACCESS",
                        ip=ip,
                        path=path,
                        user_agent=user_agent,
                        success=False
                    )
                
                # Quiet 403
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access denied"}
                )

        # CSRF protection for protected write operations
        if needs_auth and is_write:
            # Skip CSRF check for login endpoint
            if path == "/admin/login":
                return await call_next(request)

            # Skip for localhost (dev convenience)
            ip = request.client.host
            if ip in admin_lock_system.TRUSTED_IPS:
                return await call_next(request)

            # Token-auth requests are exempt from CSRF (non-browser remote automation)
            token = request.headers.get("X-ADMIN-TOKEN")
            if token and token == admin_lock_system.ADMIN_TOKEN:
                return await call_next(request)

            # Validate CSRF token
            if session_manager:
                session_token = request.cookies.get(session_manager.COOKIE_NAME)
                csrf_token = request.headers.get("X-CSRF-Token")
                if not session_token or not csrf_token:
                    logger.warning(f"🚫 [CSRF] Missing session/csrf token on {path}")
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF token required"}
                    )
                if not session_manager.validate_csrf(session_token, csrf_token):
                    logger.warning(f"🚫 [CSRF] Token mismatch on {path}")
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF token invalid"}
                    )

        return await call_next(request)
