import ast
import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

tree = ast.parse(source)

funcs_to_remove = {
    'get_admin_revenue',
    'get_revenue_forecast',
    'get_ltv_churn',
    'get_ai_revenue_boost',
    'simulate_flash_recovery',
    'execute_power_move'
}
classes_to_remove = {
    'PowerMovePayload'
}

lines = source.splitlines(True)
lines_to_keep = [True] * len(lines)

for node in tree.body:
    if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)) and node.name in funcs_to_remove:
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep[i] = False
    if isinstance(node, ast.ClassDef) and node.name in classes_to_remove:
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep[i] = False

new_source = ''.join([line for i, line in enumerate(lines) if lines_to_keep[i]])

new_source = re.sub(
    r'(app\.include_router\(\s*revenue\.router,\s*prefix=)"/api/v1/revenue"',
    r'\1"/api/v1"',
    new_source
)

if "from app.api.v1.endpoints import revenue" not in new_source and "import revenue" not in new_source:
    new_source = "from app.api.v1.endpoints import revenue\n" + new_source

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(new_source)

print('Successfully removed revenue endpoints and adjusted router includes.')
