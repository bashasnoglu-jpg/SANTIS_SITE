import requests

urls = [
    "http://localhost:8000/tr/masajlar/bali-aroma-masaji.html",
    "http://localhost:8000/tr/masajlar/thai-ayak-masaji.html",
    "http://localhost:8000/tr/masajlar/klasik-masaj.html"
]

for url in urls:
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        print(f"{url} -> {r.status_code}")
    except Exception as e:
        print(f"{url} -> Error: {e}")
