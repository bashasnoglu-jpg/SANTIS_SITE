import urllib.request
r = urllib.request.urlopen("http://127.0.0.1:5500/sitemap.xml")
print(f"Status: {r.status}")
print(f"Content-Type: {r.headers.get('Content-Type', '?')}")
data = r.read()
print(f"Size: {len(data)} bytes")
print(f"First 200 chars: {data[:200].decode()}")
