import sqlite3

def find_in_db():
    conn = sqlite3.connect("santis.db")
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cur.fetchall()]

    target = "a20d69fce01e44"
    found = False

    for table in tables:
        try:
            cur.execute(f"SELECT * FROM {table}")
            rows = cur.fetchall()
            for row in rows:
                if target in str(row):
                    print(f"[{table}] Matches: {row}")
                    found = True
        except Exception as e:
            print(f"Skipping {table}: {e}")
            
    if not found:
        print("Not found anywhere in DB.")

    conn.close()

if __name__ == "__main__":
    find_in_db()
