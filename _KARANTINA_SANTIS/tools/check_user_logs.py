import requests
import sys

BASE_URL = "http://localhost:8000"

urls = [
    "/api/activity-log?limit=50&v=1771526548173",
    "/api/activity-log/stats?v=1771526548173",
]

def check():
    print(f"--- Checking User Log URLs at {BASE_URL} ---")
    all_passed = True
    for path in urls:
        url = f"{BASE_URL}{path}"
        try:
            resp = requests.get(url)
            print(f"[GET] {path} -> {resp.status_code}")
            
            if resp.status_code != 200:
                print(f"❌ FAIL: Expected 200, got {resp.status_code}")
                # Print headers/text for debugging
                print(f"Body: {resp.text[:200]}")
                all_passed = False
            else:
                print("✅ PASS")
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
            all_passed = False
            
    if all_passed:
        print("\n🎉 ALL CHECKS PASSED: User Log URLs are working.")
    else:
        print("\n⚠️ SOME CHECKS FAILED.")

if __name__ == "__main__":
    check()
