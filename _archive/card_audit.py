"""
SANTIS Card Audit - Real-time diagnostic
Fetches pages from live server and checks for card rendering clues.
"""
import urllib.request
import json
import re
import sys

BASE = "http://localhost:8000"

def check(label, url):
    try:
        req = urllib.request.urlopen(url)
        data = req.read().decode('utf-8')
        print(f"\n{'='*60}")
        print(f"  {label}")
        print(f"  URL: {url}")
        print(f"  Status: {req.status}")
        print(f"  Size: {len(data)} bytes")
        return data
    except Exception as e:
        print(f"\n❌ {label}: FAIL - {e}")
        return None

# 1. Check services.json
print("🔍 SANTIS CARD AUDIT v1.0")
print("="*60)

svc = check("services.json", f"{BASE}/assets/data/services.json")
if svc:
    items = json.loads(svc)
    print(f"  Items: {len(items)}")
    
    # Category distribution (simulating data-bridge.js)
    massages = [i for i in items if 'massage' in (i.get('categoryId','').lower())]
    hammam = [i for i in items if 'hammam' in (i.get('categoryId','').lower()) or 'hamam' in (i.get('categoryId','').lower())]
    skincare = [i for i in items if any(k in (i.get('categoryId','').lower()) for k in ['sothys','facial','skin','face'])]
    other = [i for i in items if i not in massages and i not in hammam and i not in skincare]
    
    print(f"\n  📊 data-bridge.js simülasyonu:")
    print(f"     NV_HAMMAM:   {len(hammam)} items")
    print(f"     NV_MASSAGES: {len(massages)} items")
    print(f"     NV_SKINCARE: {len(skincare)} items")
    print(f"     NV_PRODUCTS: {len(other)} items")

    if len(massages) > 0:
        print(f"\n  🔗 İlk masaj kartının beklenen URL'si:")
        slug = massages[0].get('slug', massages[0].get('id','???'))
        print(f"     /service-detail.html?slug={slug}")

# 2. Check each category page for grid presence
for name, path in [("HAMAM", "/tr/hamam/index.html"), ("MASAJLAR", "/tr/masajlar/index.html"), ("CİLT BAKIMI", "/tr/cilt-bakimi/index.html")]:
    html = check(name, f"{BASE}{path}")
    if html:
        # Check grid
        grids = re.findall(r'<div[^>]*data-context="([^"]*)"[^>]*>', html)
        print(f"  Grid contexts: {grids}")
        
        # Check scripts
        scripts = re.findall(r'<script[^>]*src="([^"]*)"', html)
        has_data_bridge = any('data-bridge' in s for s in scripts)
        has_home_products = any('home-products' in s for s in scripts)
        print(f"  data-bridge.js: {'✅' if has_data_bridge else '❌ MISSING'}")
        print(f"  home-products.js: {'✅' if has_home_products else '❌ MISSING'}")
        
        # Check inline Engine.init
        engine_calls = re.findall(r"Engine\.init\(['\"](\w+)['\"]\)", html)
        print(f"  Engine.init calls: {engine_calls}")
        
        # Check for any event listeners that might block clicks
        prevent_default = html.count('preventDefault')
        stop_propagation = html.count('stopPropagation')
        pointer_events = html.count('pointer-events')
        print(f"  preventDefault: {prevent_default}, stopPropagation: {stop_propagation}, pointer-events: {pointer_events}")

# 3. Check service-detail.html
detail = check("service-detail.html", f"{BASE}/service-detail.html")
if detail:
    # Check how it loads data
    has_bridge = bool(re.search(r'data-bridge', detail))
    has_services_fetch = bool(re.search(r'services\.json', detail))
    slug_param = bool(re.search(r'slug', detail))
    print(f"  Uses data-bridge: {'✅' if has_bridge else '❌'}")
    print(f"  Fetches services.json: {'✅' if has_services_fetch else '❌'}")
    print(f"  Handles slug param: {'✅' if slug_param else '❌'}")

# 4. CRITICAL: Check service-detail-loader.js
try:
    loader = check("service-detail-loader.js", f"{BASE}/assets/js/service-detail-loader.js")
    if loader:
        # Check if it waits for data correctly
        has_await = 'await' in loader or 'then' in loader or 'Promise' in loader
        has_slug_match = 'slug' in loader
        has_id_match = bool(re.search(r"\.id\s*===", loader))
        print(f"  Async data loading: {'✅' if has_await else '⚠️ SYNC ONLY'}")
        print(f"  Slug matching: {'✅' if has_slug_match else '❌'}")
        print(f"  ID matching: {'✅' if has_id_match else '❌'}")
        
        # Check if it falls back to direct fetch
        has_direct_fetch = bool(re.search(r"fetch.*services\.json", loader))
        print(f"  Direct fetch fallback: {'✅' if has_direct_fetch else '❌ NO FALLBACK'}")
except:
    pass

print(f"\n{'='*60}")
print("✅ Audit Complete")
