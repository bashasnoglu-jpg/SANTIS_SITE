import ast
import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

# 1. Remove WS functions
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
source = re.sub(r'from app\.core\.websocket import manager.*?\n', '', source)

# 5. Broadcast replacements
source = source.replace('await manager.broadcast_global(', 'from app.core.pulse import pulse_engine\n        await pulse_engine.broadcast_to_hq(')
source = source.replace('await manager.broadcast_to_room(', 'from app.core.pulse import pulse_engine\n        await pulse_engine.broadcast_to_tenant(')

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

# 7. Lifespan Replacement (Careful not to replace all yields)
lifespan_setup = """    from app.core.pulse import nightly_scheduler
    await nightly_scheduler.start()
    yield
    nightly_scheduler.stop()
"""
# Replace ONLY the yield inside lifespan
source = re.sub(r'    yield(\s+# Nightly Task Cleanup|\s+pass|\s+)', '\n' + lifespan_setup, source, count=1)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("server.py safely updated for Pulse.")
