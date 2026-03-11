import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'santis.db')
print("Fixing DB:", db_path)
conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute('ALTER TABLE tenants ADD COLUMN domain VARCHAR')
    print('Added domain to tenants')
except Exception as e:
    print(e)

try:
    c.execute('ALTER TABLE tenant_configs ADD COLUMN ai_persona_type VARCHAR')
    print('Added ai_persona_type to tenant_configs')
except Exception as e:
    print(e)

try:
    c.execute('ALTER TABLE tenant_configs ADD COLUMN ai_system_prompt_override TEXT')
    print('Added ai_system_prompt_override to tenant_configs')
except Exception as e:
    print(e)

try:
    c.execute("UPDATE tenants SET domain='127.0.0.1' WHERE name LIKE '%Santis%'")
    c.execute("UPDATE tenant_configs SET ai_persona_type='santis_healer' WHERE tenant_id IN (SELECT id FROM tenants WHERE name LIKE '%Santis%')")
    conn.commit()
    print('Set default domain and persona for Santis HQ')
except Exception as e:
    print(e)

conn.close()
