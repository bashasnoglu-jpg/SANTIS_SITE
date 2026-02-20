
import requests
import json

URL = "http://127.0.0.1:8000/admin/sentinel/capabilities"

try:
    print(f"Checking {URL}...")
    resp = requests.get(URL, timeout=5)
    
    if resp.status_code == 200:
        caps = resp.json()
        print(f"✅ Capabilities: {json.dumps(caps, indent=2)}")
        
        expected_keys = ["visual_ai", "memory", "auto_fix", "reporting"]
        if all(k in caps for k in expected_keys):
            print("✅ All expected keys present.")
        else:
            print("❌ Missing keys!")
    else:
        print(f"❌ Failed: {resp.status_code}")

except Exception as e:
    print(f"❌ Error: {e}")
