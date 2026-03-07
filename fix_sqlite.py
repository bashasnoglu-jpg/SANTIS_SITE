import sqlite3
import traceback

def fix_db():
    try:
        conn = sqlite3.connect('santis.db')
        c = conn.cursor()
        
        try:
            c.execute("ALTER TABLE tenants ADD COLUMN slug VARCHAR(255);")
            print("Successfully added 'slug' to 'tenants' table.")
        except Exception as e:
            if 'duplicate column name' in str(e).lower():
                print("'slug' column already exists.")
            else:
                print(f"Error adding 'slug': {e}")
        
        conn.commit()
        
    except Exception as e:
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_db()
