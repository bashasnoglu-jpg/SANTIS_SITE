import sqlite3, glob

for db in glob.glob('*.db'):
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    try:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [t[0] for t in cur.fetchall()]
        for tbl in tables:
            cur.execute(f"PRAGMA table_info({tbl})")
            cols = [c[1] for c in cur.fetchall() if c[2] in ('TEXT', 'VARCHAR')]
            for col in cols:
                try:
                    cur.execute(f"SELECT {col} FROM {tbl} WHERE CAST({col} AS TEXT) LIKE '%.jpg%'")
                    rows = cur.fetchall()
                    if rows:
                        print(f"FOUND IN {db}.{tbl}.{col} -> {len(rows)} entries")
                        for r in rows[:5]:
                            print(f"   - {r[0]}")
                except Exception as e:
                    pass
    except Exception as e:
        print(f"DB error {db}: {e}")
