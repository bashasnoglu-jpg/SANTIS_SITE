import psycopg2

def run():
    conn = psycopg2.connect("postgresql://santis:santis1234@127.0.0.1:5432/santisdb")
    cur = conn.cursor()
    cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    tables = [r[0] for r in cur.fetchall()]

    for table in tables:
        cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}'")
        cols = [r[0] for r in cur.fetchall()]
        for col in cols:
            try:
                cur.execute(f"SELECT * FROM {table} WHERE CAST({col} AS TEXT) LIKE '%a28e75ff%'")
                rows = cur.fetchall()
                if rows:
                    print(f"FOUND IN {table}.{col}:", rows)
            except Exception as e:
                conn.rollback()

if __name__ == '__main__':
    run()
