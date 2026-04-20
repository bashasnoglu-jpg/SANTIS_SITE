"""
Santis – Sovereign Migration Script v2.0
autocommit=True kullanarak RLS/transaction sorununu çözüyor.
Her tablo için ayrı transaction, tam hata yakalama.
"""
import sqlite3
import psycopg2
import sys
import os
import traceback

SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "santis.db")
PG_DSN = "host=localhost port=5432 dbname=santisdb user=santis password=santis1234"

print("=" * 65)
print("🦾  SANTIS SOVEREIGN MIGRATION v2.0 — SQLite → PostgreSQL")
print("=" * 65)

try:
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()
    print(f"\n✅ SQLite: {SQLITE_PATH}")
except Exception as e:
    print(f"❌ SQLite hatası: {e}")
    sys.exit(1)

try:
    pg_conn = psycopg2.connect(PG_DSN)
    pg_conn.autocommit = True   # Her statement kendi transaction'ı
    pg_cur = pg_conn.cursor()
    print(f"✅ PostgreSQL: santisdb bağlantısı OK")
except Exception as e:
    print(f"❌ PostgreSQL hatası: {e}")
    sys.exit(1)

# SQLite tüm tabloları
sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables = [r[0] for r in sqlite_cur.fetchall()]
print(f"\n📋 SQLite: {len(tables)} tablo")

# PostgreSQL tüm tabloları
pg_cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
pg_tables = set(r[0] for r in pg_cur.fetchall())
print(f"📋 PostgreSQL: {len(pg_tables)} tablo")
print(f"   PG Tablolar: {sorted(pg_tables)}\n")

# Taşıma sırası (FK bağımlılığı)
MIGRATION_ORDER = [
    "tenants", "users", "customers", "rooms", "staff",
    "services", "bookings", "revenue_records", "audit_logs",
    "commissions", "user_consents", "banner_items",
    "auth_lockouts", "sessions",
]

# Sıralı + geri kalanlar
ordered = [t for t in MIGRATION_ORDER if t in tables]
remaining = [t for t in tables if t not in MIGRATION_ORDER and t not in ("alembic_version",)]
all_tables = ordered + remaining

print("─── Veri Transferi ─────────────────────────────────────────────")
total_ok = 0

for table in all_tables:
    # SQLite kayıt sayısı
    sqlite_cur.execute(f"SELECT COUNT(*) FROM \"{table}\"")
    sqlite_count = sqlite_cur.fetchone()[0]

    if sqlite_count == 0:
        print(f"  ⬜ {table}: boş, atlanıyor")
        continue

    # PG'de tablo var mı?
    if table not in pg_tables:
        print(f"  ⚠️  {table}: PG'de tablo yok, atlanıyor")
        continue

    # Sütun isimleri
    sqlite_cur.execute(f"SELECT * FROM \"{table}\" LIMIT 1")
    columns = [desc[0] for desc in sqlite_cur.description]

    # PG'deki sütunlar
    pg_cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = %s AND table_schema = 'public'
        ORDER BY ordinal_position;
    """, (table,))
    pg_cols = set(r[0] for r in pg_cur.fetchall())

    # Ortak sütunlar
    common_cols = [c for c in columns if c in pg_cols]
    if not common_cols:
        print(f"  ⚠️  {table}: Ortak sütun yok, atlanıyor")
        continue

    col_str = ", ".join(f'"{c}"' for c in common_cols)
    placeholders = ", ".join(["%s"] * len(common_cols))
    insert_sql = f'INSERT INTO "{table}" ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'

    # Tüm veriyi çek ve taşı
    sqlite_cur.execute(f"SELECT {col_str} FROM \"{table}\"")
    rows = sqlite_cur.fetchall()

    inserted = 0
    errors = 0
    for row in rows:
        try:
            pg_cur.execute(insert_sql, list(row))
            inserted += 1
        except Exception as e:
            errors += 1
            if errors <= 2:
                print(f"    ❗ {table} satır hatası: {str(e)[:100]}")

    # Sequence sync (id kolonu varsa)
    if "id" in common_cols:
        try:
            pg_cur.execute(f"""
                SELECT setval(
                    pg_get_serial_sequence('"{table}"', 'id'),
                    COALESCE((SELECT MAX(id) FROM "{table}"), 1),
                    TRUE
                );
            """)
        except Exception:
            pass  # UUID PK veya sequence yok

    icon = "✅" if errors == 0 else "⚠️ "
    err_str = f" ({errors} hata)" if errors else ""
    print(f"  {icon} {table}: {inserted}/{sqlite_count} kayıt taşındı{err_str}")
    total_ok += inserted

# ── Final Doğrulama ───────────────────────────────────────────────────
print(f"\n─── PostgreSQL Doğrulama ──────────────────────────────────────────")
for table in all_tables:
    pg_cur.execute(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name=%s AND table_schema='public'", (table,))
    if pg_cur.fetchone()[0] == 0:
        continue
    try:
        pg_cur.execute(f'SELECT COUNT(*) FROM "{table}"')
        pg_count = pg_cur.fetchone()[0]
        if pg_count > 0:
            print(f"  ✅ {table}: {pg_count} kayıt")
    except Exception:
        pass

sqlite_conn.close()
pg_conn.close()

print("\n" + "=" * 65)
print(f"🏆  SOVEREIGN MIGRATION TAMAMLANDI — {total_ok} kayıt taşındı")
print("=" * 65)
