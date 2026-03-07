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
            c.execute(f"SELECT COUNT(*) FROM {table_name} WHERE CAST({col} AS TEXT) LIKE '%6345fd3700d64fdd9%'")
            count = c.fetchone()[0]
            if count > 0:
                print(f"Found in {table_name}.{col}")
                new_val = "assets/img/hero-wellness.webp" # dummy image default
                c.execute(f"UPDATE {table_name} SET {col} = REPLACE(CAST({col} AS TEXT), 'assets/img/uploads/6345fd3700d64fdd9e158236fe7aebe1.png', 'assets/img/hero-wellness.webp') WHERE CAST({col} AS TEXT) LIKE '%6345fd37%'")
                conn.commit()
                print("Updated!")
                found = True
        except Exception as e:
            pass

if not found:
    print("No matching record found in db.")
conn.close()
