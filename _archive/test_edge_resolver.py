import asyncio
import sys
import os
import aiohttp
import time

sys.path.append(os.getcwd())
from database import AsyncSessionLocal
from app.services.publish_engine import AtomicPublishEngine

PORT = 8000
BASE_URL = f"http://127.0.0.1:{PORT}"

async def test_resolver():
    print("\n[Phase B3 Tests] Starting Edge Resolver Validation")
    
    # Pre-test step: Ensure content exists
    async with AsyncSessionLocal() as db:
        engine = AtomicPublishEngine(db)
        slug = "b3-test-resolver-massage"
        payload = {"title": "B3 Edge Test", "description": "High speed testing content."}
        
        # Publish
        res = await engine.publish_content(slug, "tr", "tr", payload, "tester")
        active_hash = res["hash"]
        print(f"-> Seeded hash: {active_hash}")

    async with aiohttp.ClientSession() as session:
        resolver_url = f"{BASE_URL}/api/v1/content/resolve/{slug}?region=tr&locale=tr"
        
        print("\n--- TEST 1: First Request (Cold Cache) ---")
        t0 = time.perf_counter()
        async with session.get(resolver_url) as resp:
            t1 = time.perf_counter()
            data = await resp.text()
            headers = resp.headers
            
            print(f"Status: {resp.status}")
            print(f"Latency: {(t1-t0)*1000:.2f}ms")
            assert resp.status == 200, "Resolver should return 200 on first hit"
            
            cache_control = headers.get("Cache-Control", "")
            etag_raw = headers.get("ETag", "")
            server_etag = etag_raw.strip('"')

            print(f"Cache-Control: {cache_control}")
            print(f"ETag: {etag_raw}")
            
            assert "immutable" in cache_control, "Cache-Control immutable missing!"
            assert server_etag == active_hash, "ETag does not match DB Active Hash!"

        print("\n--- TEST 2: Second Request (ETag If-None-Match) ---")
        req_headers = {"If-None-Match": f'"{server_etag}"'}
        t2 = time.perf_counter()
        async with session.get(resolver_url, headers=req_headers) as resp2:
            t3 = time.perf_counter()
            print(f"Status: {resp2.status}")
            print(f"Latency: {(t3-t2)*1000:.2f}ms")
            
            assert resp2.status == 304, f"Resolver MUST return 304 Not Modified. Got {resp2.status}"
            # 304 responses have no body
            
        print("\n--- TEST 3: Stale Request (Invalid ETag) ---")
        req_headers_stale = {"If-None-Match": '"some-old-hash"'}
        t4 = time.perf_counter()
        async with session.get(resolver_url, headers=req_headers_stale) as resp3:
            t5 = time.perf_counter()
            print(f"Status: {resp3.status}")
            print(f"Latency: {(t5-t4)*1000:.2f}ms")
            assert resp3.status == 200, "Stale cache request should fetch fresh 200 body!"

        print("\n✅ All Edge Resolver Tests Passed!")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_resolver())
