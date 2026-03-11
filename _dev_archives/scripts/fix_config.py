with open('app/api/v1/endpoints/services.py', 'r', encoding='utf-8') as f:
    s_source = f.read()

s_source = s_source.replace('from app.core._config import settings', 'from app.core.config import settings')

with open('app/api/v1/endpoints/services.py', 'w', encoding='utf-8') as f:
    f.write(s_source)

print("Fixed config import.")
