import sqlite3
import re

db_path = "c:/Users/tourg/Desktop/SANTIS_SITE/santis.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = c.fetchall()

found = False
for table in tables:
    table_name = table[0]
    c.execute(f"PRAGMA table_info({table_name});")
    columns = [row[1] for row in c.fetchall()]
    
    for col in columns:
        try:
            c.execute(f"UPDATE {table_name} SET {col} = REPLACE(CAST({col} AS TEXT), 'assets/img/hero-wellness.webp', 'assets/img/hero-general.webp') WHERE CAST({col} AS TEXT) LIKE '%hero-wellness%'")
            if c.rowcount > 0:
                print(f"Updated {c.rowcount} rows in {table_name}.{col}")
                found = True
        except Exception as e:
            pass

conn.commit()
if not found:
    print("No matching record found in db.")
conn.close()
