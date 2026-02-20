import requests
import time

BASE_URL = "http://localhost:8000"

def visit_and_check(path, session, name):
    try:
        res = session.get(f"{BASE_URL}{path}")
        print(f"[{name}] Visited {path}: {res.status_code}")
        
        # Check Reco
        reco = session.get(f"{BASE_URL}/api/oracle/recommendation")
        if reco.status_code == 200:
            data = reco.json()
            if data.get("show"):
                print(f"[{name}] ✅ POPUP RECEIVED: {data['title']} - {data['message']}")
                print(f"[{name}] 🔗 LINK: {data['link']}")
            else:
                print(f"[{name}] ℹ️ No popup yet (Visits: {len(session.cookies)})")
        else:
            print(f"[{name}] ❌ API Error: {reco.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

print("🚀 Testing Smart Popups...")

# User 1: Massage Enthusiast (3 visits > returns "Interest")
s1 = requests.Session()
visit_and_check("/masaj/bali-masaji.html", s1, "User1")
visit_and_check("/masaj/medical-masaj.html", s1, "User1")
visit_and_check("/masaj/aromaterapi.html", s1, "User1")

# User 2: Loyal User (6 visits > returns "VIP")
s2 = requests.Session()
for i in range(6):
    visit_and_check("/hamam/geleneksel-kese.html", s2, "User2")
