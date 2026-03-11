import ast
import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

# 1. Update broadcasts
source = source.replace('await manager.broadcast_global(', 'from app.core.pulse import pulse_engine\n        await pulse_engine.broadcast_to_hq(')
source = source.replace('await manager.broadcast_to_room(', 'from app.core.pulse import pulse_engine\n        await pulse_engine.broadcast_to_tenant(')

# 2. Add pulse_engine/nightly_scheduler to lifespan
lifespan_setup = """    from app.core.pulse import nightly_scheduler
    await nightly_scheduler.start()
"""
lifespan_teardown = """    nightly_scheduler.stop()
"""

source = source.replace('yield', lifespan_setup + '    yield\n' + lifespan_teardown)

# 3. Add Pulse Router Include
source = source.replace('from app.api.v1.endpoints import session_auth\\nfrom app.api.v1.endpoints import auth', 'from app.api.v1.endpoints import session_auth\\nfrom app.api.v1.endpoints import auth\\nfrom app.api.v1.endpoints import pulse_router')
source = source.replace('    session_auth.router,', '    session_auth.router,\\n)\\napp.include_router(\\n    pulse_router.router,\\n    tags=["pulse"],')

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("Pulse engine hooked into server.py broadcasts and lifespan.")
