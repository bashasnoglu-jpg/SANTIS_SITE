import sqlite3

def dump_users():
    conn = sqlite3.connect('santis.db')
    cursor = conn.cursor()
    
    print("--- RAW USERS DUMP ---")
    cursor.execute("SELECT quote(id), id, email FROM users")
    rows = cursor.fetchall()
    for row in rows:
        print(f"Row: {row}")
        
    conn.close()

if __name__ == "__main__":
    dump_users()
