import sqlite3, glob, json, os

results = []

print("=== CHECKING DB FILES ===")
for db in glob.glob('*.db'):
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    for (tbl,) in cur.fetchall():
        cur.execute(f"PRAGMA table_info({tbl})")
        columns = cur.fetchall()
        text_cols = [c[1] for c in columns if c[2] in ('TEXT', 'VARCHAR')]
        for col in text_cols:
            try:
                cur.execute(f"SELECT rowid, {col} FROM {tbl} WHERE {col} LIKE '%00ffe68%' OR {col} LIKE '%.jpg%'")
                rows = cur.fetchall()
                if rows:
                    print(f"[!] {db} -> {tbl}.{col} HAS {len(rows)} matching rows (e.g. {rows[0]})")
                    results.append(f"{db}.{tbl}")
            except Exception as e:
                pass


print("\n=== CHECKING HARDCODED JSON/JS ===")
def search_dir(d):
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(('.json', '.js', '.html', '.py')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if '00ffe68da' in content or '.jpg' in content:
                            print(f"[!] {path} matches!")
                except:
                    pass

search_dir('app')
search_dir('assets')
search_dir('components')
search_dir('admin')
search_dir('tr')
search_dir('guest-zen')

print("DONE")
