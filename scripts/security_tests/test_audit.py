import requests
import time
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def run_tests():
    print("--- STARTING GLOBAL AUDIT MIDDLEWARE TESTS ---")
    
    # Trigger 401 Unauthorized
    res_401 = requests.get(f"{BASE_URL}/api/admin/content/status")
    print(f"401 Attempt (No Token): {res_401.status_code}")

    # Trigger 423 Locked (using our known locked account from previous test)
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    payload = {"username": "admin_hacker@santis.club", "password": "wrong"}
    res_423 = requests.post(f"{BASE_URL}/api/v1/auth/login", data=payload, headers=headers)
    print(f"423 Attempt (Locked Account): {res_423.status_code}")

    # Trigger 429 Too Many Requests (Spamming auth another 11 times)
    payload_new = {"username": "spammer@santis.club", "password": "wrong"}
    for i in range(12):
        res_429 = requests.post(f"{BASE_URL}/api/v1/auth/login", data=payload_new, headers=headers)
        if res_429.status_code == 429:
            print(f"429 Attempt (Rate Limit Hit): {res_429.status_code}")
            break

    print("\n--- READING AUDIT TRAIL JSON ---")
    base_dir = Path(__file__).resolve().parent.parent.parent
    log_file = base_dir / "assets" / "data" / "global_audit_trail.json"
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Print the top 3 events (newest)
            print(json.dumps(data[:3], indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Could not read audit log: {e}")

if __name__ == "__main__":
    run_tests()
