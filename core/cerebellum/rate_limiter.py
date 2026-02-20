
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

# Logger
logger = logging.getLogger("SantisSecurity")

class RateLimiter:
    """
    In-Memory Rate Limiter (Fixed Window).
    For critical production with multiple workers, Redis is preferred.
    But for Single-Node Santis OS, this is sufficient and fast.
    """
    def __init__(self):
        # 1. Configuration (Production-Safe)
        self.TRUSTED_IPS = ["127.0.0.1", "::1", "localhost"]
        
        self.SAFE_PATHS = [
            "/api/health", 
            "/api/oracle/status", 
            "/favicon.ico"
        ]
        
        # Storage: {ip: { "count": int, "reset_time": float, "blocked_until": float }}
        self.visitors = {}
        
        # RULES (Path Prefix -> Limit per minute)
        self.rules = {
            "/admin/login": 5,    # Brute Force Protection (5 attempts/min)
            "/api/vip": 10,       # High Security (Campaigns)
            "/api/oracle": 60,    # Medium (Tracking)
            "/admin": 1000,       # Unlocked for Admin (via Bypass) but fallback high limit
            "default": 120        # Global Fallback
        }
        
        # Block Duration (seconds) if limit exceeded
        self.BLOCK_DURATION = 30

        # Login-specific block duration (15 minutes)
        self.LOGIN_BLOCK_DURATION = 15 * 60

    def is_allowed(self, ip: str, path: str) -> tuple[bool, dict]:
        """
        Check if request is allowed.
        Returns: (is_allowed, headers_dict)
        """
        # 1. Trusted IP Bypass (Localhost / Office)
        if ip in self.TRUSTED_IPS:
             return True, {}
             
        # 2. Safe Endpoint Bypass (Health Checks, Status)
        if path in self.SAFE_PATHS:
            return True, {}
            
        # 3. Admin Route Bypass (Manager Mode)
        # Protects the admin panel from self-locking while using heavy APIs
        if path.startswith(("/admin", "/api/admin")):
             return True, {}

        now = time.time()
        
        # 4. Get User State
        if ip not in self.visitors:
            self.visitors[ip] = {
                "count": 0, 
                "reset_time": now + 60,
                "blocked_until": 0
            }
        
        user = self.visitors[ip]

        # 2. Check Block
        if user["blocked_until"] > now:
            retry_after = int(user["blocked_until"] - now)
            return False, {"Retry-After": str(retry_after)}

        # 3. Reset Window if expired
        if now > user["reset_time"]:
            user["count"] = 0
            user["reset_time"] = now + 60
            
        # 4. Determine Limit
        limit = self.rules["default"]
        for prefix, rule_limit in self.rules.items():
            if path.startswith(prefix) and prefix != "default":
                limit = rule_limit
                break
        
        # 5. Check Limit
        if user["count"] >= limit:
            # Block User (longer block for login paths)
            block_time = self.LOGIN_BLOCK_DURATION if path.startswith("/admin/login") else self.BLOCK_DURATION
            user["blocked_until"] = now + block_time
            logger.warning(f"🚫 IP {ip} rate limited on {path}. Blocked for {block_time}s.")
            return False, {"Retry-After": str(block_time)}
        
        # 6. Increment
        user["count"] += 1
        
        # Headers
        headers = {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(limit - user["count"]),
            "X-RateLimit-Reset": str(int(user["reset_time"] - now))
        }
        
        return True, headers

# Instance
santis_rate_limiter = RateLimiter()

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        
        # Skip Static Assets (Performance)
        if request.url.path.startswith(("/assets", "/favicon.ico")):
             return await call_next(request)

        ip = request.client.host
        path = request.url.path
        
        # Check Limit
        allowed, headers = santis_rate_limiter.is_allowed(ip, path)
        
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"error": "Too Many Requests", "message": "Santis Security Shield Active. Please wait."},
                headers=headers
            )
            
        # Process Request
        response = await call_next(request)
        
        # Add Rate Limit Headers to Response
        for key, value in headers.items():
            response.headers[key] = value
            
        return response
