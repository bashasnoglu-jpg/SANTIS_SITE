import requests
import json
import time

BASE_URL = "http://localhost:8001"

def verify_endpoints():
    print("--- STARTING VERIFICATION ---")
    
    # 1. Check SEO Score
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/seo/score")
        print(f"GET /api/admin/seo/score: {resp.status_code}")
        if resp.status_code == 200:
            print(f"Response: {resp.json()}")
        else:
            print(f"ERROR: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

    time.sleep(1)
    # 2. Check CSRF Token
    try:
        resp = requests.get(f"{BASE_URL}/api/csrf-token")
        print(f"GET /api/csrf-token: {resp.status_code}")
        if resp.status_code == 200:
            print(f"Response: {resp.json()}")
        else:
            print(f"ERROR: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

    # 3. Trigger Audit Log (via fix/ghost)
    fix_type = "verification_test_" + str(int(time.time()))
    try:
        resp = requests.post(f"{BASE_URL}/admin/fix/{fix_type}")
        print(f"POST /admin/fix/{fix_type}: {resp.status_code}")
        if resp.status_code == 200:
            print(f"Response: {resp.json()}")
        else:
            print(f"ERROR: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")
        
    # 4. Check Activity Log
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/activity-log?limit=5")
        print(f"GET /api/admin/activity-log: {resp.status_code}")
        if resp.status_code == 200:
            logs = resp.json()
            print(f"Logs count: {len(logs)}")
            if logs:
                print(f"Latest log: {logs[0]}")
                # Verify if our fix action is in the logs
                found = False
                for log in logs:
                    details = log.get("details", {})
                    # Ensure details is dict, might be string if sqlite JSON handling is weird
                    if isinstance(details, str):
                        try:
                            details = json.loads(details)
                        except:
                            pass
                    
                    if isinstance(details, dict) and details.get("fix_type") == fix_type:
                        found = True
                        print("SUCCESS: Found verification test log!")
                        break
                if not found:
                    print("WARNING: Verification test log not found in top 5.")
            else:
                print("WARNING: No logs returned.")
        else:
            print(f"ERROR: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    verify_endpoints()
