
import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def check_endpoint(path):
    try:
        url = f"{BASE_URL}{path}"
        print(f"Checking {url}...")
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            print(f"✅ {path} OK: {resp.json()}")
            return True
        else:
            print(f"❌ {path} FAIL: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"❌ {path} ERROR: {e}")
        return False

# Give server time to reload
time.sleep(2)

print("--- Sentinel Verification ---")
status_ok = check_endpoint("/admin/sentinel-status")
incidents_ok = check_endpoint("/admin/sentinel/incidents")

if status_ok and incidents_ok:
    print("\n✅ All Systems Operational")
    sys.exit(0)
else:
    print("\n❌ System Verification Failed")
    sys.exit(1)
