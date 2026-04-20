import sqlite3

try:
    conn = sqlite3.connect('santis.db')
    c = conn.cursor()
    c.execute("PRAGMA table_info('crm_intent_summaries')")
    cols = c.fetchall()
    print("crm_intent_summaries columns:")
    for col in cols:
        print(col)
    
    c.execute("PRAGMA table_info('crm_guest_traces')")
    cols2 = c.fetchall()
    print("crm_guest_traces columns:")
    for col in cols2:
        print(col)
        
except Exception as e:
    print("Error:", e)
finally:
    conn.close()
