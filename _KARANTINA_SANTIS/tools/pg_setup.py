"""
Santis – Sovereign DB Setup
PostgreSQL'de santisdb veritabanını ve gerekli extension'ları hazırlar.
"""
import subprocess, sys, os

PG_BIN = r"C:\Program Files\PostgreSQL\18\bin"
PSQL = os.path.join(PG_BIN, "psql.exe")
PG_PASS = "postgres"

def run(cmd_args, db="postgres"):
    env = os.environ.copy()
    env["PGPASSWORD"] = PG_PASS
    base = [PSQL, "-U", "postgres", "-d", db, "-v", "ON_ERROR_STOP=0"]
    result = subprocess.run(base + ["-c", cmd_args], capture_output=True, text=True, env=env)
    out = (result.stdout + result.stderr).strip()
    print(f"  CMD: {cmd_args[:60]}")
    print(f"  OUT: {out[:200]}")
    return result.returncode

print("=" * 60)
print("🏛️  SANTIS SOVEREIGN DB SETUP")
print("=" * 60)

print("\n[1] Mevcut veritabanları kontrol ediliyor...")
run("SELECT datname FROM pg_database;")

print("\n[2] santis rolü oluşturuluyor (varsa hata görmezden gelinir)...")
run("DO $$ BEGIN CREATE ROLE santis WITH LOGIN PASSWORD 'santis1234'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;")

print("\n[3] santisdb veritabanı oluşturuluyor...")
# CREATE DATABASE psql -c ile yapılmalı (DO bloğu içinde olmaz)
env = os.environ.copy()
env["PGPASSWORD"] = PG_PASS
r = subprocess.run(
    [PSQL, "-U", "postgres", "-c", "CREATE DATABASE santisdb OWNER santis;"],
    capture_output=True, text=True, env=env
)
out = (r.stdout + r.stderr).strip()
if "already exists" in out or "zaten mevcut" in out:
    print("  OUT: santisdb zaten mevcut ✅")
else:
    print(f"  OUT: {out}")

print("\n[4] uuid-ossp extension aktif ediliyor...")
run('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', db="santisdb")

print("\n[5] Kontrol: santisdb bağlantısı test ediliyor...")
env2 = os.environ.copy()
env2["PGPASSWORD"] = "santis1234"
r2 = subprocess.run(
    [PSQL, "-U", "santis", "-d", "santisdb", "-c", "SELECT current_database(), current_user;"],
    capture_output=True, text=True, env=env2
)
print("  OUT:", (r2.stdout + r2.stderr).strip()[:300])

print("\n✅ DB SETUP TAMAMLANDI")
