import sqlite3
import os

db_path = 'c:/Users/tourg/Desktop/SANTIS_SITE/app.db'
if not os.path.exists(db_path):
    print('Db not found:', db_path)
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [x[0] for x in c.fetchall()]
    print('Tables:', tables)
    for t in tables:
        c.execute(f"PRAGMA table_info({t});")
        cols = [col[1] for col in c.fetchall() if col[2] in ('TEXT', 'VARCHAR')]
        for col in cols:
            try:
                c.execute(f"SELECT \"{col}\" FROM \"{t}\" WHERE \"{col}\" LIKE '%00ffe68da9cc448a8d538536b5378fa0%'")
                res = c.fetchall()
                if res:
                    print(f"Match found in table {t}, column {col}:", res)
            except Exception as e:
                pass
