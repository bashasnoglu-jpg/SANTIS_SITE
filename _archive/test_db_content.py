import sqlite3

try:
    conn = sqlite3.connect('santis.db')
    cursor = conn.cursor()
    cursor.execute("SELECT tenant_id, count(*) FROM services GROUP BY tenant_id")
    rows = cursor.fetchall()
    
    print(f"Tenant ID counts in services table:")
    for r in rows:
        print(f"Tenant: '{r[0]}', Count: {r[1]}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
