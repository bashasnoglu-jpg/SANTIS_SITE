import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

target_pass = "santis123"
stored_hash_str = os.getenv("ADMIN_PASS_HASH")
stored_user = os.getenv("ADMIN_USER")

print(f"User in .env: {stored_user}")
print(f"Hash in .env: {stored_hash_str}")

if not stored_hash_str:
    print("❌ No hash found in .env")
else:
    stored_hash = stored_hash_str.encode()
    try:
        if bcrypt.checkpw(target_pass.encode(), stored_hash):
            print("✅ Hash MATCHES 'santis123'")
        else:
            print("❌ Hash DOES NOT match 'santis123'")
    except Exception as e:
        print(f"❌ Error checking hash: {e}")

print("\n--- Generating NEW Hash for 'santis123' ---")
new_hash = bcrypt.hashpw(target_pass.encode(), bcrypt.gensalt()).decode()
print(f"NEW HASH: {new_hash}")
