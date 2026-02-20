import requests

BASE_URL = "http://localhost:8000"

def visit(session, path):
    try:
        session.get(f"{BASE_URL}{path}")
    except: pass

def check_layout(session, name, expected_top):
    try:
        res = session.get(f"{BASE_URL}/api/dynamic-home/score")
        if res.status_code == 200:
            data = res.json()
            order = data.get("order", [])
            print(f"\nExample Layout for {name}:")
            print(f"Top 3 Sections: {order[:3]}")
            
            if order and order[0] == expected_top:
                print(f"✅ SUCCESS: {name} sees '{expected_top}' first.")
            else:
                print(f"❌ FAIL: {name} sees '{order[0]}' first (Expected: {expected_top}).")
        else:
            print(f"❌ API Error: {res.status_code}")
    except Exception as e:
        print(f"Error: {e}")

print("🚀 Testing Dynamic Homepage...")

# 1. Massage Enthusiast
s1 = requests.Session()
print("...Simulating Massage User...")
visit(s1, "/masaj/bali-masaji.html")
visit(s1, "/masaj/medical-masaj.html")
visit(s1, "/masaj/aromaterapi.html")
check_layout(s1, "Massage Fan", "masaj")

# 2. Hammam Lover
s2 = requests.Session()
print("...Simulating Hammam User...")
visit(s2, "/hamam/geleneksel-kese.html")
visit(s2, "/hamam/sultan-hamami.html")
visit(s2, "/hamam/geleneksel-kese.html") 
check_layout(s2, "Hammam Fan", "hammam")

# 3. New User (Default)
s3 = requests.Session()
print("...Simulating New User...")
check_layout(s3, "New User", "global-trends")
