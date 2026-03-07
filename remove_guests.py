import ast
import re

# 1. Clean admin.py
with open('app/api/v1/endpoints/admin.py', 'r', encoding='utf-8') as f:
    source_admin = f.read()

tree_admin = ast.parse(source_admin)
funcs_admin = {'get_vip_roster'}
lines_admin = source_admin.splitlines(True)
lines_to_keep_admin = [True] * len(lines_admin)

for node in tree_admin.body:
    if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)) and node.name in funcs_admin:
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep_admin[i] = False

new_source_admin = ''.join([line for i, line in enumerate(lines_admin) if lines_to_keep_admin[i]])
with open('app/api/v1/endpoints/admin.py', 'w', encoding='utf-8') as f:
    f.write(new_source_admin)


# 2. Clean server.py
with open('server.py', 'r', encoding='utf-8') as f:
    source_server = f.read()

tree_server = ast.parse(source_server)
funcs_server = {
    'generate_vip_profile',
    'get_guest_memory',
    'update_guest_memory',
    'ai_observe_guest',
    'flashback_trigger',
    'classify_dna',
    'get_guest_dna_clusters_v2',
    'get_guest_dna_clusters'
}

lines_server = source_server.splitlines(True)
lines_to_keep_server = [True] * len(lines_server)

for node in tree_server.body:
    if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)) and node.name in funcs_server:
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep_server[i] = False
    if isinstance(node, ast.ClassDef) and node.name == 'ProfileRequest':
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep_server[i] = False
    if isinstance(node, ast.Assign):
        if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            if node.targets[0].id in {'DNA_CATEGORY_KEYWORDS', 'DNA_PERSONAS'}:
                start = node.lineno
                end = node.end_lineno
                for i in range(start - 1, end):
                    lines_to_keep_server[i] = False

new_source_server = ''.join([line for i, line in enumerate(lines_server) if lines_to_keep_server[i]])

# Inject the router inclusion dynamically right after revenue.router in server.py
router_block = """app.include_router(
    revenue.router,
    prefix=\"/api/v1\",
    tags=[\"revenue\"],
)
app.include_router(
    guests.router,
    prefix=\"/api/v1\",
    tags=[\"guests\"]
)"""

new_source_server = re.sub(
    r'app\.include_router\(\s*revenue\.router,\s*prefix="/api/v1",\s*tags=\["revenue"\],\s*\)',
    router_block,
    new_source_server
)

if "import guests" not in new_source_server and "from app.api.v1.endpoints import guests" not in new_source_server:
    new_source_server = "from app.api.v1.endpoints import guests\n" + new_source_server

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(new_source_server)

print('Successfully cleaned up guests endpoints from admin.py and server.py')
