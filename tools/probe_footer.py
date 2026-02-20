import requests
try:
    r = requests.get("http://127.0.0.1:8000/assets/html/components/footer.html")
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('content-type')}")
    print(f"Body: {r.text[:100]}")
except Exception as e:
    print(e)
