import sqlite3

conn = sqlite3.connect('santis.db')
c = conn.cursor()

c.execute("SELECT id, slot, filepath FROM gallery_assets WHERE filepath LIKE '%e51fc45dbf7f4db2b3dbfad147971a9b.png%' OR cdn_url LIKE '%e51fc45dbf7f4db2b3dbfad147971a9b.png%'")
rows = c.fetchall()

print("Found matching assets:")
for row in rows:
    print(row)

conn.close()
