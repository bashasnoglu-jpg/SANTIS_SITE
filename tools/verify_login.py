import os
import bcrypt
from dotenv import load_dotenv

# Force reload dotenv
load_dotenv(override=True)

user = os.getenv("ADMIN_USER")
raw_hash = os.getenv("ADMIN_PASS_HASH")

print(f"Loaded User: '{user}'")
print(f"Loaded Hash String: '{raw_hash}'")

if not raw_hash:
    print("ERROR: Hash is empty!")
    exit()

hash_bytes = raw_hash.encode('utf-8')
test_pass = "santis123"

print(f"Testing against password: '{test_pass}'")

try:
    if bcrypt.checkpw(test_pass.encode('utf-8'), hash_bytes):
        print("✅ SUCCESS: Password matches the hash in .env")
    else:
        print("❌ FAILURE: Password does NOT match. Hash is wrong or corrupted.")
except Exception as e:
    print(f"❌ CRITICAL ERROR: {e}")
