
import requests
import time
import os

ENDPOINT = "http://localhost:8000/admin/deep-audit/fix/sitemap"
SITEMAP_PATH = "c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\sitemap.xml"

def verify():
    print(f"🚀 Triggering Sitemap Generation via: {ENDPOINT}")
    try:
        response = requests.get(ENDPOINT)
        print(f"Response Code: {response.status_code}")
        print(f"Response JSON: {response.json()}")
        
        if response.status_code == 200 and response.json().get("status") == "success":
            print("✅ API reported success.")
            
            # Check file content
            if os.path.exists(SITEMAP_PATH):
                size = os.path.getsize(SITEMAP_PATH)
                print(f"📁 Local Sitemap Size: {size} bytes")
                
                with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
                    content = f.read()
                    url_count = content.count("<url>")
                    print(f"📊 URL Count in XML: {url_count}")
                    
                    if url_count > 5:
                        print("✅ Sitemap contains significant content.")
                        print(content[:500] + "...")
                        return True
                    else:
                        print("❌ Sitemap seems empty or sparse.")
            else:
                print("❌ sitemap.xml not found on disk!")
        else:
            print("❌ API failed.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify()
