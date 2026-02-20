
import sys
import os
import json
from fastapi.testclient import TestClient

# Add project root to path
sys.path.append(os.getcwd())

try:
    from server import app
except ImportError:
    print("❌ Could not import server.py. Make sure you are in the root directory.")
    sys.exit(1)

client = TestClient(app)

def test_santis_os_api():
    print("🧪 Testing Santis OS API (Phase 1)...")
    
    # 1. Test Services Catalog
    print("\n[1] GET /api/v1/services")
    res_services = client.get("/api/v1/services")
    if res_services.status_code == 200:
        services = res_services.json()
        print(f"✅ Success. Found {len(services)} services.")
        if len(services) > 0:
            print(f"   Sample: {services[0]['id']} ({services[0]['slug']})")
    else:
        print(f"❌ Failed: {res_services.status_code}")
        print(res_services.text)

    # 2. Test Locations
    print("\n[2] GET /api/v1/locations")
    res_locations = client.get("/api/v1/locations")
    if res_locations.status_code == 200:
        locations = res_locations.json()
        print(f"✅ Success. Found {len(locations)} locations.")
        if len(locations) > 0:
            print(f"   Sample: {locations[0]['id']} ({locations[0]['slug']})")
    else:
        print(f"❌ Failed: {res_locations.status_code}")

    # 3. Test Menu (Integration)
    # Pick a location slug from previous step or default to 'alba-royal'
    target_slug = "alba-royal"
    print(f"\n[3] GET /api/v1/locations/{target_slug}/menu")
    res_menu = client.get(f"/api/v1/locations/{target_slug}/menu")
    if res_menu.status_code == 200:
        data = res_menu.json()
        menu = data.get("menu", [])
        if len(menu) > 0:
            print(f"✅ Success. Menu has {len(menu)} items.")
            item = menu[0]
            # Correct structure based on services.json: item['i18n']['en']['title']
            # Fallback to 'tr' if 'en' is missing
            title = item.get('i18n', {}).get('en', {}).get('title') or item.get('i18n', {}).get('tr', {}).get('title') or "Unknown"
            print(f"   Sample Item: {title} - {item['pricing'][0]['amount']} {item['pricing'][0]['currency']}")
        else:
            print("⚠️ Success but menu is empty.")
    else:
        print(f"❌ Failed: {res_menu.status_code}")
        print(res_menu.text)

if __name__ == "__main__":
    test_santis_os_api()
