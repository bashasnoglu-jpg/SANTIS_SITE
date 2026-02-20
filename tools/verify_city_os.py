
import requests
import time
import threading

BASE_URL = "http://localhost:8000/admin/city"

def verify_scan():
    print("📡 Testing City Scan...")
    try:
        res = requests.get(f"{BASE_URL}/scan")
        print(f"Status: {res.status_code}")
        print(f"Report: {res.json()}")
        if res.status_code == 200 and "ghosts" in res.json():
            print("✅ Scan Successful")
            return True
        return False
    except Exception as e:
        print(f"❌ Scan Error: {e}")
        return False

def verify_protocol():
    print("🚀 Testing Protocol Execution (Dry Run)...")
    try:
        # Test Unknown Protocol first (safest)
        res = requests.post(f"{BASE_URL}/execute/protocol_test_dummy")
        print(f"Dummy Protocol Response: {res.json()}")
        
        # Test UTF-8 Protocol (Low Risk)
        res = requests.post(f"{BASE_URL}/execute/protocol_utf8")
        print(f"UTF-8 Protocol Trigger: {res.json()}")
        
        if res.status_code == 200:
            print("✅ Protocol Triggered")
            return True
        return False
    except Exception as e:
        print(f"❌ Protocol Error: {e}")
        return False

if __name__ == "__main__":
    scan_ok = verify_scan()
    time.sleep(1)
    proto_ok = verify_protocol()
    
    if scan_ok and proto_ok:
        print("\n🎉 City OS V300 API Verification COMPLETE.")
    else:
        print("\n⚠️ City OS Verification FAILED.")
