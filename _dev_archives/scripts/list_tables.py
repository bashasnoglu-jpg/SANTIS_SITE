import sqlite3

try:
    conn = sqlite3.connect('app/db/santis_sso.db')
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cur.fetchall()
    print("Tables:", tables)
    conn.close()
except Exception as e:
    print('DB Error:', e)
