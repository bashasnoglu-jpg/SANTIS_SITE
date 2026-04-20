import sqlite3
import os
import glob

db_files = glob.glob('c:/Users/tourg/Desktop/SANTIS_SITE/**/*.db', recursive=True) + glob.glob('c:/Users/tourg/Desktop/SANTIS_SITE/**/*.sqlite', recursive=True)

for db_path in db_files:
    if 'venv' in db_path: continue
    
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [x[0] for x in c.fetchall()]
        
        for t in tables:
            c.execute(f"PRAGMA table_info({t});")
            cols = [col[1] for col in c.fetchall() if col[2] in ('TEXT', 'VARCHAR')]
            for col in cols:
                try:
                    c.execute(f"SELECT \"{col}\" FROM \"{t}\" WHERE \"{col}\" LIKE '%00ffe68da9cc448a8d538536b5378fa0%'")
                    res = c.fetchall()
                    if res:
                        print(f"Match found in DB {db_path}, table {t}, column {col}:", res)
                except Exception as inner_e:
                    pass
    except Exception as e:
        pass
