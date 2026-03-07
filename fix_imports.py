# Patch bookings.py
with open('app/api/v1/endpoints/bookings.py', 'r', encoding='utf-8') as f:
    b_source = f.read()

if 'from sqlalchemy import desc' not in b_source and 'from sqlalchemy import select, func, desc' not in b_source:
    b_source = b_source.replace('from sqlalchemy import select, func, and_', 'from sqlalchemy import select, func, and_, desc')

with open('app/api/v1/endpoints/bookings.py', 'w', encoding='utf-8') as f:
    f.write(b_source)

# Patch server.py
with open('server.py', 'r', encoding='utf-8') as f:
    s_source = f.read()

if 'from app.db.models.service import Service' not in s_source:
    # insert it near the top
    s_source = "from app.db.models.service import Service\n" + s_source

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(s_source)

print("Imports fixed.")
