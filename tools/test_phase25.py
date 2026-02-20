import requests
import time

try:
    print("🌍 Sending Request to Santis Server...")
    res = requests.get("http://localhost:8000/")
    
    print(f"Status Code: {res.status_code}")
    
    citizen_id = res.headers.get("X-Santis-Citizen-ID")
    is_new = res.headers.get("X-Santis-Citizen-New")
    location = res.headers.get("X-Santis-Location")
    cookie = res.cookies.get("santis_citizen_id")
    
    print(f"X-Santis-Citizen-ID: {citizen_id}")
    print(f"X-Santis-Citizen-New: {is_new}")
    print(f"X-Santis-Location: {location}")
    print(f"Cookie 'santis_citizen_id': {cookie}")
    
    if citizen_id and cookie and location:
        print("✅ SUCCESS: Citizen ID Assigned, Cookie Set, and Location Resolved!")
    else:
        print("❌ FAILURE: Headers or Cookie missing.")

    # ORACLE CHECK
    print("\n🔮 Checking Oracle Pulse...")
    oracle_res = requests.get("http://localhost:8000/api/oracle/status")
    if oracle_res.status_code == 200:
        print(f"✅ ORACLE ONLINE: {oracle_res.json()}")
    else:
        print(f"❌ ORACLE ERROR: {oracle_res.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")
