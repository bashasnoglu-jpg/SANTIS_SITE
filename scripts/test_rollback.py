import requests
import sys

API_DELETE_URL = "http://localhost:8000/api/admin/content/tr/{}"
API_STATUS_URL = "http://localhost:8000/api/admin/content/status"

pilots = [
    "kombine-masaj",
    "kese-ve-kopuk-masaji",
    "kopuk-masaji",
    "kahve-peeling",
    "tuz-peeling"
]

print("--- PHASE 12: ROLLBACK & SOFT DELETE TEST ---")
for slug in pilots:
    res = requests.delete(API_DELETE_URL.format(slug))
    if res.status_code == 200:
        print(f"SUCCESS: {slug} Soft-Deleted. Purge Triggered.")
    else:
        print(f"FAILED: {slug} | Code: {res.status_code} | {res.text}")

print("\n--- SLA METRICS (POST-ROLLBACK) ---")
status = requests.get(API_STATUS_URL).json()
for k, v in status.items():
    print(f"{k}: {v}")
