import requests

urls = [
    "http://localhost:8000/tr/masajlar/bali-aroma-masaji.html",
    "http://localhost:8000/tr/masajlar/thai-ayak-masaji.html"
]

for url in urls:
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        print(f"URL: {url}")
        print(f"Status: {r.status_code}")
        print(f"Content-Type: {r.headers.get('content-type')}")
        print(f"Body (first 100 chars): {r.text[:100]}")
        print("-" * 40)
    except Exception as e:
        print(f"{url} -> Error: {e}")
