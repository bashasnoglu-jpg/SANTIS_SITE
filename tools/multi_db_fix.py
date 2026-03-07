import os
import sqlite3
import re

ROOT = 'c:/Users/tourg/Desktop/SANTIS_SITE'
pattern = re.compile(r'\.(jpg|png|jpeg)(?=[^a-zA-Z0-9]|$)', re.IGNORECASE)

def fix_all_databases():
    print("Sovereign Protocol: Scanning ALL SQLite databases for WebP Migration...")
    total_dbs_updated = 0
    total_rows = 0
    
    for r, d, f in os.walk(ROOT):
        if 'node_modules' in r or 'venv' in r or 'backup' in r or '.git' in r:
            continue
        for file in f:
            if file.endswith('.db') or file.endswith('.sqlite'):
                db_path = os.path.join(r, file)
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = [t[0] for t in cursor.fetchall()]
                    
                    db_updated = False
                    
                    for table in tables:
                        try:
                            cursor.execute(f"PRAGMA table_info({table});")
                            columns = [col[1] for col in cursor.fetchall() if col[2] in ('TEXT', 'VARCHAR')]
                            
                            for col in columns:
                                try:
                                    cursor.execute(f"SELECT rowid, {col} FROM {table} WHERE {col} LIKE '%.jpg%' OR {col} LIKE '%.png%' OR {col} LIKE '%.jpeg%';")
                                    rows = cursor.fetchall()
                                    for row in rows:
                                        rowid, val = row
                                        if val:
                                            new_val = pattern.sub('.webp', val)
                                            if new_val != val:
                                                cursor.execute(f"UPDATE {table} SET {col} = ? WHERE rowid = ?", (new_val, rowid))
                                                total_rows += 1
                                                db_updated = True
                                except Exception:
                                    pass
                        except Exception:
                            pass
                    
                    if db_updated:
                        conn.commit()
                        total_dbs_updated += 1
                        print(f"✓ Updated rows in DB: {db_path}")
                    conn.close()
                except Exception as e:
                    pass

    print(f"\\n✓ Sovereign Multi-DB Fix Complete! Updated {total_rows} rows across {total_dbs_updated} databases.")

if __name__ == '__main__':
    fix_all_databases()
