import requests
import sys

base_url = "http://localhost:8000"
endpoints = [
    "/api/health-score",
    "/api/health-history",
    "/api/config",
    "/api/pages/home"
]

print(f"Testing API endpoints at {base_url}...")
for ep in endpoints:
    try:
        url = base_url + ep
        res = requests.get(url)
        print(f"{ep}: {res.status_code}")
        if res.status_code != 200:
            print(f"  -> Content: {res.text[:100]}")
    except Exception as e:
        print(f"{ep}: Failed to connect ({e})")
