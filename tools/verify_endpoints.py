import requests
import sys

BASE_URL = "http://localhost:8000"

endpoints = [
    ("GET", "/api/admin/analytics/dashboard"),
    ("GET", "/api/activity-log"),
    ("POST", "/admin/intelligence/scan"),
    ("POST", "/admin/visual-audit"),
    ("GET", "/api/oracle/status"),
    ("GET", "/api/admin/tone-health"),
    ("GET", "/admin/deep-audit/start"),
    ("GET", "/admin/auto-security-patch"),
    # New Aliases (Phase 28.5)
    ("GET", "/admin/api/csrf-token"),
    ("GET", "/admin/ai-fix-suggestions"),
    ("GET", "/admin/run-link-audit"),
    ("POST", "/admin/run-dom-audit"),
    ("POST", "/admin/security-audit"),
    ("GET", "/api/system/health"),
]

def verify():
    print(f"--- Verifying Endpoints at {BASE_URL} ---")
    all_passed = True
    for method, path in endpoints:
        url = f"{BASE_URL}{path}"
        try:
            if method == "GET":
                resp = requests.get(url)
            else:
                resp = requests.post(url, json={"type": "full"}) # Send dummy payload
            
            print(f"[{method}] {path} -> {resp.status_code}")
            
            if resp.status_code != 200:
                print(f"❌ FAIL: Expected 200, got {resp.status_code}")
                all_passed = False
            else:
                print("✅ PASS")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
            all_passed = False
            
    if all_passed:
        print("\n🎉 ALL CHECKS PASSED: Admin Stub Router is Active!")
    else:
        print("\n⚠️ SOME CHECKS FAILED.")

if __name__ == "__main__":
    verify()
