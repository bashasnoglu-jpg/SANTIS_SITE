import sqlite3
import json

try:
    conn = sqlite3.connect('santis.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # Check what table has slot='hero_home'
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row['name'] for row in cur.fetchall()]
    print("Tables:", tables)

    # Looking for asset table specifically
    for t in tables:
        try:
            cur.execute(f"PRAGMA table_info({t})")
            columns = [r['name'] for r in cur.fetchall()]
            if 'slot' in columns and 'url' in columns:
                print(f"Candidate table found: {t}")
                cur.execute(f"SELECT * FROM {t} WHERE slot='hero_home'")
                rows = cur.fetchall()
                for r in rows:
                    print(dict(r))
                
                # Update it
                cur.execute(f"UPDATE {t} SET url='/assets/img/cards/anasayfa_hero_8k_v1.webp' WHERE slot='hero_home'")
                print(f"Updated {t}. Rows affected:", cur.rowcount)
        except Exception as ex:
            pass

    conn.commit()
    conn.close()
except Exception as e:
    print('DB Error:', e)
