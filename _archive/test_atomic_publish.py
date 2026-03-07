import asyncio
import os
import sys

sys.path.append(os.getcwd())

from database import AsyncSessionLocal
from app.services.publish_engine import AtomicPublishEngine

async def run_pipeline_test():
    async with AsyncSessionLocal() as db:
        engine = AtomicPublishEngine(db)
        
        # Test 1: Publish brand new content
        print("\n--- TEST 1: New Publish ---")
        payload1 = {"title": "Premium Massage", "price": 500, "desc": "Relaxing spa treatment."}
        res1 = await engine.publish_content(
            slug="premium-massage",
            region="tr",
            locale="en",
            payload=payload1,
            actor="test_script_admin"
        )
        print(f"Result 1: {res1}")

        # Test 2: Idempotent Publish (Same content)
        print("\n--- TEST 2: Idempotent Publish ---")
        res2 = await engine.publish_content(
            slug="premium-massage",
            region="tr",
            locale="en",
            payload=payload1, # Exact same payload
            actor="test_script_admin"
        )
        print(f"Result 2: {res2}")
        assert res2["action_taken"] == "no_change", "Idempotency failed!"

        # Test 3: Update Publish (New Hash)
        print("\n--- TEST 3: Update Content ---")
        payload2 = {"title": "Premium Massage", "price": 600, "desc": "Relaxing spa treatment (updated)."}
        res3 = await engine.publish_content(
            slug="premium-massage",
            region="tr",
            locale="en",
            payload=payload2,
            actor="test_script_admin"
        )
        print(f"Result 3: {res3}")
        assert res3["hash"] != res1["hash"], "Hash should have changed!"
        
        # Test 4: AI Tone Check Warning
        print("\n--- TEST 4: AI Tone Check ---")
        payload3 = {"title": "Cheap Massage", "desc": "Discount spa treatment."}
        res4 = await engine.publish_content(
            slug="cheap-massage",
            region="tr",
            locale="en",
            payload=payload3,
            actor="test_script_admin"
        )
        print(f"Result 4: {res4}")
        assert len(res4["warnings"]) > 0, "AI Tone check did not trigger warning!"

        print("\n✅ All Pipeline Tests Passed.")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_pipeline_test())
