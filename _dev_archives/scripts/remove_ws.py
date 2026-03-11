import ast
import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

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

new_source = ''.join([line for i, line in enumerate(lines) if lines_to_keep[i]])

# Remove remaining legacy WS imports
new_source = re.sub(r'from app\.core\.websocket import manager.*?\n', '', new_source)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(new_source)

print("Removed old WS endpoints from server.py")
