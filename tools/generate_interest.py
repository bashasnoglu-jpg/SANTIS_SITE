import requests
import time

BASE_URL = "http://localhost:8000"

def visit(path):
    try:
        res = requests.get(f"{BASE_URL}{path}")
        print(f"Visited {path}: {res.status_code}")
        # Keep session alive (cookies)
        return res.cookies
    except Exception as e:
        print(f"Error visiting {path}: {e}")
        return None

print("🚀 Generating Interest Data...")

# User 1: Massage Enthusiast
session = requests.Session()
visit("/masaj/bali-masaji.html")
visit("/masaj/medical-masaj.html")
visit("/masaj/aromaterapi.html")
print("✅ User 1 (Massage) active.")

# User 2: Hammam Lover
session2 = requests.Session()
visit("/hamam/geleneksel-kese.html")
visit("/hamam/sultan-paketi.html")
print("✅ User 2 (Hammam) active.")
