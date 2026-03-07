import time
import json
import uuid
from datetime import datetime, timezone
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from pathlib import Path
from app.core.logger import request_id_var, structured_logger as logger

# 2. FastAPI Middleware: Her isteğe UUID tak
class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = str(uuid.uuid4())
        token = request_id_var.set(req_id) # Bu andan itibaren tüm loglarda bu ID görünecek
        
        with logger.contextualize(request_id=req_id, path=request.url.path):
            logger.info(f"📥 [REQUEST START] {request.method} {request.url.path}")
            try:
                response = await call_next(request)
                # İstemciye (Frontend) bu ID'yi dön. Müşteri hata alırsa "Hata Kodu: req_id" göstersin
                response.headers["X-Request-ID"] = req_id
                logger.info(f"📤 [REQUEST END] Status: {response.status_code}")
                return response
            except Exception as e:
                logger.exception("🚨 FATAL ERROR: İşlenmeyen Hata")
                raise
            finally:
                request_id_var.reset(token)

class GlobalAuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.log_file = base_dir / "assets" / "data" / "global_audit_trail.json"
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        if not self.log_file.parent.exists():
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            
        if not self.log_file.exists():
            with open(self.log_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _determine_event_type(self, status: int, path: str) -> str:
        if status == 401:
            return "auth_fail"
        if status == 403:
            return "forbidden_access"
        if status == 423:
            return "lockout_triggered"
        if status == 429:
            return "rate_limited"
        return "api_request"

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Only log specific security/access-related statuses as requested (or all if desired, but requirements focused on 401, 403, 429, 423)
        if response.status_code in [401, 403, 423, 429]:
            client_ip = request.client.host if request.client else "unknown"
            
            # Attempt to extract Actor from request state if authenticated
            actor = "unknown"
            if hasattr(request.state, "user") and request.state.user:
                actor = getattr(request.state.user, "email", "unknown")
            elif "username" in request.query_params:
                actor = request.query_params["username"]

            # Same for region
            region = request.headers.get("X-Region", "tr")

            event_type = self._determine_event_type(response.status_code, request.url.path)
            
            event_data = {
                "ts": datetime.now(timezone.utc).isoformat() + "Z",
                "actor": actor,
                "ip": client_ip,
                "region": region,
                "event": event_type,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code
            }
            
            self._write_log(event_data)

        return response

    def _write_log(self, event_data: dict):
        try:
            with open(self.log_file, "r+", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = []
                
                data.insert(0, event_data)
                
                if len(data) > 1000:
                    data = data[:1000]
                    
                f.seek(0)
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.truncate()
        except:
            pass # Fail silently for audit middleware

from fastapi.responses import JSONResponse

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Durum değiştirmeyen istekler (GET, HEAD, OPTIONS) CSRF gerektirmez
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)
            
        # İstisnalar: Login ve Stripe Webhook (Bunlar auth çerezi beklemez)
        exempt_routes = [
            "/api/v1/auth/login", 
            "/api/v1/commerce/webhook",
            "/api/v1/telemetry/ingest",
            "/api/v1/telemetry/aurelia-mock",
            "/api/v1/crm/trace",
            "/api/v1/events/batch"
        ]
        if request.url.path in exempt_routes:
            return await call_next(request)

        # 🚨 CSRF GİYOTİNİ: Cookie'deki token ile Header'daki token EŞLEŞMELİ
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("x-csrf-token") # HTTP başlıkları case-insensitive'dir

        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            logger.critical(f"🛑 [CSRF BLOCKED] Sahte istek girişimi engellendi! IP: {request.client.host if request.client else 'Unknown'} Path: {request.url.path}")
            return JSONResponse(status_code=403, content={"detail": "CSRF doğrulama hatası. İstek reddedildi."})

        return await call_next(request)
