import sqlite3

try:
    conn = sqlite3.connect('app/db/santis_sso.db')
    cur = conn.cursor()
    cur.execute("UPDATE media_assets SET url='/assets/img/cards/anasayfa_hero_8k_v1.webp' WHERE slot='hero_home'")
    print(cur.rowcount, 'rows updated')
    conn.commit()
    conn.close()
except Exception as e:
    print('DB Error:', e)
