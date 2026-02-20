from sqlalchemy import create_engine, inspect
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings

def inspect_db():
    try:
        db_url = settings.DATABASE_URL.replace("+aiosqlite", "")
        engine = create_engine(db_url)
        inspector = inspect(engine)
        
        if not inspector.has_table("users"):
            print("ERROR: users table missing")
            return

        columns = inspector.get_columns("users")
        col_names = [c["name"] for c in columns]
        
        print(f"Users Table Columns: {col_names}")
        
        if "email" in col_names:
            print("SUCCESS: email column exists")
        else:
            print("FAILURE: email column missing")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    inspect_db()
