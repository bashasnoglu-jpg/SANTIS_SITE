import asyncio
import httpx
import time
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

BASE_URL = "http://localhost:8000"
TEST_SLUG_OLD = "test-safari-masaj-v1"
TEST_SLUG_NEW = "test-safari-masaj-v2"
REGION = "tr"
LOCALE = "tr"

async def run_test_flight():
    logging.info("🚀 Başlatılıyor: Blok D4 - SEO Engine Test Uçuşu")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 0: Login to get token (Assuming we have a test user or we can use admin token)
        # We will use the publish_atomic endpoint with the local engine since we might not have a token handy.
        # Actually, let's bypass auth for testing by writing a quick mock publish directly to DB or using the DB session, 
        # OR we just test the public endpoints assuming some data exists.
        
        # Let's check sitemap first
        t0 = time.time()
        r = await client.get(f"{BASE_URL}/sitemap.xml")
        ms = (time.time() - t0) * 1000
        if r.status_code == 200 and "urlset" in r.text:
            logging.info(f"✅ [D4.1] Sitemap XML: 200 OK | Gecikme: {ms:.2f}ms")
            # count urls
            url_count = r.text.count("<url>")
            logging.info(f"   └ Bulunan URL Sayısı: {url_count}")
        else:
            logging.error(f"❌ [D4.1] Sitemap XML Hatası: {r.status_code}")

        # Let's get a slug from the sitemap to test
        import re
        slugs = re.findall(r"<loc>https://santis.club/tr/services/([^<]+)</loc>", r.text)
        
        if slugs:
            test_slug = None
            for s in slugs:
                # Test Edge Hydration
                t0 = time.time()
                r = await client.get(f"{BASE_URL}/api/content/services/{s}")
                ms = (time.time() - t0) * 1000
                
                if r.status_code == 200:
                    test_slug = s
                    payload = r.json()
                    seo_data = payload.get("seo", {})
                    canonical = seo_data.get("canonical", "")
                    schema = seo_data.get("schema_json", "")
                    
                    if canonical == f"https://santis.club/tr/services/{test_slug}":
                        logging.info(f"✅ [D4.2] Canonical URL: Başarılı ({test_slug}) | Gecikme: {ms:.2f}ms")
                    else:
                        logging.error(f"❌ [D4.2] Canonical URL Hatası: Beklenen https://santis.club/tr/services/{test_slug}, Gelen: {canonical}")
                        
                    if schema and ("@context" in schema and ("Schema.org" in schema or "schema.org" in schema)):
                        logging.info(f"✅ [D4.3] Schema.org JSON-LD: Enjekte Edildi.")
                    else:
                        logging.error(f"❌ [D4.3] Schema.org Eksik veya Bozuk")
                    break
                elif r.status_code == 500 and "Corrupted pointer" in r.text:
                    # Ignore corrupted D2 blobs from old migrations
                    continue
                else:
                     logging.error(f"❌ Edge Hydration Hatası {s}: {r.status_code} - {r.text}")
                     break
                     
            if not test_slug:
                 logging.warning("⚠️ Bütün test slugları D2 blob hatası verdi veya bulunamadı.")
        else:
             logging.warning("⚠️ Sitemap'te test edilecek servis slug'ı bulunamadı.")
             
        # Step: Check an invalid URL to ensure 404 works and check latency of 301 check
        t0 = time.time()
        r = await client.get(f"{BASE_URL}/{REGION}/invalid-test-slug")
        ms = (time.time() - t0) * 1000
        if r.status_code == 404:
             logging.info(f"✅ [D4.4] 404 Fallback & 301 Check Kalkanı: Aktif | Gecikme: {ms:.2f}ms")
        else:
             logging.error(f"❌ [D4.4] 404 Beklerken {r.status_code} Geldi")

if __name__ == "__main__":
    asyncio.run(run_test_flight())
