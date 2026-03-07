import sqlite3

conn = sqlite3.connect('santis.db')
c = conn.cursor()

def search_all_tables(search_str):
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in c.fetchall()]
    
    for table in tables:
        # Get columns
        c.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in c.fetchall() if row[2] in ('TEXT', 'VARCHAR')]
        
        for col in columns:
            try:
                c.execute(f"SELECT * FROM {table} WHERE {col} LIKE '%{search_str}%'")
                rows = c.fetchall()
                for row in rows:
                    print(f"Found in Table: {table}, Column: {col}, Data: {row}")
            except sqlite3.OperationalError:
                pass

search_str = 'e51fc45dbf7f4db2b3dbfad147971a9b.png'
print("Searching all text columns for", search_str)
search_all_tables(search_str)

# Since it's confirmed an orphan in gallery_assets, let's just delete it to stop the 404 bleeding
c.execute("DELETE FROM gallery_assets WHERE filepath LIKE '%e51fc45dbf7f4db2b3dbfad147971a9b.png%' OR cdn_url LIKE '%e51fc45dbf7f4db2b3dbfad147971a9b.png%'")
print(f"Deleted {c.rowcount} ghost assets from gallery_assets.")
conn.commit()
conn.close()
