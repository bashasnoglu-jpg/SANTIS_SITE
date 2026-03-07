import sqlite3
conn = sqlite3.connect('santis.db')
cursor = conn.cursor()
cursor.execute('SELECT sql FROM sqlite_master WHERE type='table' AND name='gallery_assets';')
print(cursor.fetchone()[0])
