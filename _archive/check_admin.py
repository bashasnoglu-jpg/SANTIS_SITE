import sqlite3
import sys

try:
    conn = sqlite3.connect('santis.db')
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE email='admin@santis.com'")
    user = cursor.fetchone()
    if user:
        print(f"FOUND: {user[0]}")
    else:
        print("MISSING")
except Exception as e:
    print(f"ERROR: {e}")
finally:
    conn.close()
