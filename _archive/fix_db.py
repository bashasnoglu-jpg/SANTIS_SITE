import sqlite3
import os

db_path = "c:/Users/tourg/Desktop/SANTIS_SITE/santis.db"

if not os.path.exists(db_path):
    print("DB not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Hatalı resmi kullanan servisleri bul
cursor.execute("SELECT id, name, image_path FROM services WHERE image_path LIKE '%6345fd37%'")
rows = cursor.fetchall()

if not rows:
    print("Resim bulunamadı.")
else:
    for row in rows:
        print("UPDATE:", row)
    # Varsayılan bir resim veya boşluk ile değiştir (assets/img/hero-wellness.webp var)
    cursor.execute("UPDATE services SET image_path = 'assets/img/hero-wellness.webp' WHERE image_path LIKE '%6345fd37%'")
    conn.commit()
    print("Fix uygulandı!")

conn.close()
