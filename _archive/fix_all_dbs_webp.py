import sqlite3
import glob

print("Replacing .jpg with .webp in all SQLite databases...")
for db_file in glob.glob('*.db'):
    try:
        conn = sqlite3.connect(db_file)
        cur = conn.cursor()
        
        # Determine all tables
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [t[0] for t in cur.fetchall()]
        
        updates_made = 0
        for tbl in tables:
            cur.execute(f"PRAGMA table_info({tbl})")
            cols = [c[1] for c in cur.fetchall() if c[2] in ('TEXT', 'VARCHAR')]
            
            for col in cols:
                try:
                    # Update statement replacing .jpg with .webp
                    cur.execute(f"UPDATE {tbl} SET {col} = REPLACE(CAST({col} AS TEXT), '.jpg', '.webp') WHERE CAST({col} AS TEXT) LIKE '%.jpg%'")
                    if cur.rowcount > 0:
                        print(f"[{db_file}] Updated {cur.rowcount} rows in {tbl}.{col}")
                        updates_made += cur.rowcount
                except Exception as e:
                    pass
                    
        if updates_made > 0:
            conn.commit()
            print(f"[{db_file}] Successfully committed {updates_made} updates.")
        conn.close()
    except Exception as e:
        print(f"Error processing {db_file}: {e}")

print("Database Visual Armor operation complete.")
