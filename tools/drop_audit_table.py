from sqlalchemy import create_engine, text
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

def drop_audit_table():
    try:
        db_url = settings.DATABASE_URL.replace("+aiosqlite", "")
        engine = create_engine(db_url)
        
        with engine.connect() as conn:
            print("Dropping audit_logs table...")
            conn.execute(text("DROP TABLE IF EXISTS audit_logs"))
            conn.commit()
            print("SUCCESS: audit_logs table dropped.")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    drop_audit_table()
