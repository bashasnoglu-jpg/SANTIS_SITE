import sqlite3
import os

db_path = 'app.db'
if not os.path.exists(db_path):
    print("app.db not found!")
    exit()

conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    cur.execute("SELECT id, filepath, cdn_url FROM gallery_assets")
    rows = cur.fetchall()
    print(f"Total entries in gallery_assets: {len(rows)}")
    for r in rows:
        print(r)
except Exception as e:
    print(f"Error querying gallery_assets: {e}")
