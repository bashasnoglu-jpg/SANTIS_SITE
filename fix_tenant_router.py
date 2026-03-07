with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

source = source.replace('db_path=str(BASE_DIR / "santis.db"),', '')

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("Fixed TypeError in TenantRouterMiddleware.")
