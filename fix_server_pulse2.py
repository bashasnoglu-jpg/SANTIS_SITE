import ast
import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

# 1. Remove WS functions via AST
tree = ast.parse(source)
funcs_to_remove = {'pulse_stream', 'ws_endpoint'}
lines = source.splitlines(True)
lines_to_keep = [True] * len(lines)

for node in tree.body:
    if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)) and node.name in funcs_to_remove:
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep[i] = False

source = ''.join([line for i, line in enumerate(lines) if lines_to_keep[i]])

# 2. Update imports
source = source.replace('from app.api.v1.endpoints import auth', 'from app.api.v1.endpoints import session_auth\nfrom app.api.v1.endpoints import auth\nfrom app.api.v1.endpoints import pulse_router')
source = source.replace('    auth,', '    auth,\n    session_auth,\n    pulse_router,')

# 3. Update router
source = source.replace('app.include_router(\n    auth.router,', 'app.include_router(\n    session_auth.router,\n    prefix="/api/v1/auth",\n    tags=["auth"],\n)\napp.include_router(\n    pulse_router.router,\n    tags=["pulse"],\n)\napp.include_router(\n    auth.router,')

# 4. Remove WS manager
source = re.sub(r'^([ \t]*)from app\.core\.websocket import manager.*?\n', '', source, flags=re.MULTILINE)

# 5. Broadcast replacements WITH MULTILINE INDENTATION PRESERVATION
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

# 6. Inject CSRF Middleware
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

# 7. Lifespan Replacement
# We look for the exact "yield" inside lifespan. 
lifespan_setup = """    from app.core.pulse import nightly_scheduler
    await nightly_scheduler.start()
    yield
    nightly_scheduler.stop()"""

# Since yield in lifespan is indented with 4 spaces usually
source = re.sub(r'^([ \t]*)yield(\s+# Nightly Task Cleanup|\s+pass|\s+)(?=\n[ \t]*event_dispatcher\.stop\(\))', 
                r'\1from app.core.pulse import nightly_scheduler\n\1await nightly_scheduler.start()\n\1yield\n\1nightly_scheduler.stop()\2', 
                source, count=1, flags=re.MULTILINE)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("server.py safely updated with indentation retention.")
