import os
import re
import sqlite3

ROOT = 'c:/Users/tourg/Desktop/SANTIS_SITE'
DB_PATH = os.path.join(ROOT, 'santis.db')

pattern = re.compile(r'\.(jpg|png|jpeg)(?=[^a-zA-Z0-9]|$)', re.IGNORECASE)

def fix_json_and_js_files():
    print("Sovereign Protocol: Checking JSON and JS for missed webp updates...")
    updated = 0
    matches = 0
    for dirpath, _, files in os.walk(ROOT):
        if any(skip in dirpath for skip in ['node_modules', 'venv', 'backup', '.git']):
            continue
        for f in files:
            if f.endswith(('.json', '.js', '.html', '.css')):
                path = os.path.join(dirpath, f)
                try:
                    with open(path, 'r', encoding='utf-8') as file:
                        content = file.read()
                    if pattern.search(content):
                        matches += len(pattern.findall(content))
                        new_content = pattern.sub('.webp', content)
                        with open(path, 'w', encoding='utf-8') as file:
                            file.write(new_content)
                        updated += 1
                except Exception:
                    pass
    print(f"JSON/JS Fix: {updated} files updated. {matches} references changed to .webp.")

def fix_sqlite_db():
    print("Sovereign Protocol: Checking SQLite database (santis.db) for missed webp images...")
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return
        
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        total_updated = 0
        
        for table in tables:
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
                                total_updated += 1
                except Exception:
                    pass
        conn.commit()
        conn.close()
        print(f"Sovereign DB Fix: {total_updated} rows updated in santis.db from JPG/PNG to WEBP.")
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == '__main__':
    fix_json_and_js_files()
    fix_sqlite_db()
