import sqlite3
import glob

print("Checking all databases for gallery_assets...")
for db_file in glob.glob('*.db'):
    try:
        conn = sqlite3.connect(db_file)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' and name='gallery_assets'")
        if cur.fetchone():
            print(f"--- Found gallery_assets in {db_file} ---")
            cur.execute("SELECT id, filepath FROM gallery_assets")
            rows = cur.fetchall()
            print(f"Total rows: {len(rows)}")
            for r in rows:
                if '.jpg' in r[1]:
                    print(f" !!! JPG FOUND: {r}")
                elif '00ffe' in r[1]:
                    print(f" !!! HASH FOUND: {r}")
    except Exception as e:
        print(f"Error reading {db_file}: {e}")
print("Done")
