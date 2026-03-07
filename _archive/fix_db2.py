import sqlite3
conn = sqlite3.connect("c:/Users/tourg/Desktop/SANTIS_SITE/santis.db")
c = conn.cursor()
c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='services';")
print("services:", c.fetchone()[0])

c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='service_translations';")
row = c.fetchone()
if row: print("translations:", row[0])
conn.close()
