import sys
import os
import asyncio
from pathlib import Path

# PYTHONPATH setup
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.db.base import Base
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker
import sqlite3

# 1. PostgreSQL Engine Oluşturma (Sync)
PG_URL = "postgresql+psycopg2://santis:santis1234@127.0.0.1:5432/santisdb"
pg_engine = create_engine(PG_URL, echo=False)

# 2. Şema Oluşturma (Base'den gelen modellerle)
print("=> PostgreSQL veritabanı şeması oluşturuluyor (create_all)...")
try:
    Base.metadata.create_all(bind=pg_engine)
    print("=> Şema başarıyla oluşturuldu.")
except Exception as e:
    print("=> Şema oluşturulurken hata:", e)
    sys.exit(1)

# 3. SQLite verilerini okuyup PostgreSQL'e aktarma
print("=> SQLite'tan veri pompalanıyor...")
SQLITE_DB = "santis.db"
if not os.path.exists(SQLITE_DB):
    print(f"=> ERROR: {SQLITE_DB} bulunamadı!")
    sys.exit(1)

try:
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_cursor = sqlite_conn.cursor()

    # Hangi tablolar var?
    sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in sqlite_cursor.fetchall() if r[0] != 'sqlite_sequence']

    # Her tabloyu postgresql'e insert et
    with pg_engine.begin() as pg_conn:
        for table in tables:
            sqlite_cursor.execute(f"PRAGMA table_info({table})")
            columns_info = sqlite_cursor.fetchall()
            columns = [c[1] for c in columns_info]

            # Verileri al
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()

            if not rows:
                print(f" - {table} tablosu boş, atlanıyor.")
                continue

            # Bazı tablolar metadata'da yoksa veya özel tipleri varsa hata alabilir, doğrudan SQL ile pushluyoruz.
            col_names = ", ".join([f'"{c}"' for c in columns])
            placeholders = ", ".join([f":{c}" for c in columns])
            insert_query = text(f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING')
            
            # Veri listesini dict'lere çevir
            rows_dicts = [dict(zip(columns, row)) for row in rows]
            
            try:
                pg_conn.execute(insert_query, rows_dicts)
                print(f" + {table} tablosuna {len(rows)} kayıt pompalandı.")
            except Exception as e:
                # UUID uyuşmazlığı vs varsa
                print(f" ! HATA: {table} tablosuna kayıt atılamadı. Hata: {e}")

    sqlite_conn.close()
    print("=> Data pompalaması tamamlandı!")
except Exception as e:
    print("FATAL:", e)
    sys.exit(1)
