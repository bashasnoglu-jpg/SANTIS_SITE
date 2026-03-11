import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

# 1. Delete ws_endpoint block
source = re.sub(
    r'@app\.websocket\("/ws"\)\s*async def ws_endpoint\(websocket: WebSocket\):.*?except WebSocketDisconnect:\s*ws_manager\.disconnect\(websocket,\s*room_id\)\n', 
    '', source, flags=re.DOTALL
)

# 2. Delete pulse_stream block
source = re.sub(
    r'# WebSocket: Zekayı Dashboard\'a bağlayan.*?\n@app\.websocket\("/ws/pulse"\)\s*async def pulse_stream\(websocket: WebSocket\):.*?except WebSocketDisconnect:\s*manager\.disconnect\(websocket,\s*"hq_global"\)\n',
    '', source, flags=re.DOTALL
)

# 3. Update Broadcasts
source = re.sub(
    r'^([ \t]*)await manager\.broadcast_global\(', 
    r'\1from app.core.pulse import pulse_engine\n\1await pulse_engine.broadcast_to_hq(', 
    source, flags=re.MULTILINE
)

source = re.sub(
    r'^([ \t]*)await manager\.broadcast_to_room\(', 
    r'\1from app.core.pulse import pulse_engine\n\1await pulse_engine.broadcast_to_tenant(', 
    source, flags=re.MULTILINE
)

# 4. Remove WS Manager Imports
source = re.sub(r'^([ \t]*)from app\.core\.websocket import manager.*?\n', '', source, flags=re.MULTILINE)

# 5. Inject CSRF Middleware
middleware_code = """
# ── SOVEREIGN SHIELD PHASE OMEGA: CSRF MIDDLEWARE ────────
from fastapi.responses import JSONResponse
@app.middleware("http")
async def csrf_shield_middleware(request: Request, call_next):
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

"""
source = source.replace('app.add_middleware(GlobalAuditMiddleware)', 'app.add_middleware(GlobalAuditMiddleware)\n' + middleware_code)

# 6. Routers
source = source.replace('from app.api.v1.endpoints import auth', 'from app.api.v1.endpoints import session_auth\nfrom app.api.v1.endpoints import pulse_router\nfrom app.api.v1.endpoints import auth')
source = source.replace('    auth,', '    auth,\n    session_auth,\n    pulse_router,')

source = source.replace('app.include_router(\n    auth.router,', 'app.include_router(\n    session_auth.router,\n    prefix="/api/v1/auth",\n    tags=["auth"],\n)\napp.include_router(\n    pulse_router.router,\n    tags=["pulse"],\n)\napp.include_router(\n    auth.router,')

# 7. Lifespan Injection 
# Exactly replace     yield that appears before event_dispatcher.stop()
lifespan_setup = """    from app.core.pulse import nightly_scheduler
    await nightly_scheduler.start()
    yield
    nightly_scheduler.stop()"""
source = re.sub(r'    yield(\s+# Nightly Task Cleanup|\s+pass|\s+)(?=\n[ \t]*event_dispatcher\.stop\(\))', 
                '\n' + lifespan_setup + r'\1', 
                source, count=1)


with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("server.py surgically updated with pure text replacements.")
