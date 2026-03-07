import sqlite3
import glob

print("Direct repair for santis.db gallery_assets...")
try:
    conn = sqlite3.connect('santis.db')
    cur = conn.cursor()
    cur.execute("SELECT id, filepath FROM gallery_assets WHERE filepath LIKE '%.jpg%'")
    rows = cur.fetchall()
    print(f"Found {len(rows)} legacy JPG entries.")
    
    updated = 0
    for r in rows:
        new_path = r[1].replace('.jpg', '.webp')
        cur.execute("UPDATE gallery_assets SET filepath=? WHERE id=?", (new_path, r[0]))
        updated += 1
    conn.commit()
    print(f"Successfully repaired {updated} JPG links in santis.db -> gallery_assets")
    conn.close()
except Exception as e:
    print(f"Error checking santis.db: {e}")

try:
    conn = sqlite3.connect('santis_v15_master.db')
    cur = conn.cursor()
    cur.execute("SELECT id, filepath FROM gallery_assets WHERE filepath LIKE '%.jpg%'")
    rows = cur.fetchall()
    print(f"Found {len(rows)} legacy JPG entries in santis_v15_master.db.")
    
    updated = 0
    for r in rows:
        new_path = r[1].replace('.jpg', '.webp')
        cur.execute("UPDATE gallery_assets SET filepath=? WHERE id=?", (new_path, r[0]))
        updated += 1
    conn.commit()
    print(f"Successfully repaired {updated} JPG links in santis_v15_master.db -> gallery_assets")
    conn.close()
except Exception as e:
    print(f"Error checking santis_v15_master.db: {e}")

print("DONE FIXING DBs!")
