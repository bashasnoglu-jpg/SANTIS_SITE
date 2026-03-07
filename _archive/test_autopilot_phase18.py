"""
Phase 18: AI Autopilot — generate_sovereign_invite() Unit Test
Tests the sovereign invite function with a John Wick whale scenario.
Runs as a simple sync wrapper (no server needed).
"""
import asyncio, sys, os
sys.path.insert(0, os.getcwd())

async def test_sovereign_invite():
    from app.core.gemini_engine import generate_sovereign_invite

    print("=" * 60)
    print("PHASE 18: AI AUTOPILOT — SOVEREIGN INVITE TEST")
    print("=" * 60)

    # Simulate an oracle result for a whale
    mock_oracle = {
        "session_id": "test-jw-autopilot-001",
        "guest_name": "John Wick",
        "composite_score": 0.91,
        "tier": "whale",
        "is_whale": True,
        "service_interest": "Hammam Ritueli",
        "nudge": {"type": "vip_nudge", "message": "VIP Katmanı aktif", "cta": "Özel Deneyim"},
        "behavioral_tags": ["high_intent", "returning_guest"],
        "components": {"intent": 0.91, "recency": 0.85, "aov": 0.6, "behavior": 0.75},
    }

    print("\n[Test] John Wick — Whale Autopilot Invite")
    result = await generate_sovereign_invite(mock_oracle)

    print(f"  Source      : {result['source']}")
    print(f"  Promo Code  : {result['promo_code']}")
    print(f"  WA CTA      : {result['whatsapp_cta']}")
    print(f"  Message     :\n    {result['message']}")
    print()

    assert "message" in result, "FAIL: 'message' key missing"
    assert "promo_code" in result and result["promo_code"].startswith("VIP-"), "FAIL: promo_code format wrong"
    assert result["whatsapp_cta"] is True, "FAIL: whatsapp_cta must be True"
    assert len(result["message"]) > 20, "FAIL: message too short"
    print("  ✅ PASS")

    # Test 2: Anonymous guest
    print("[Test] Anonymous — Fallback")
    mock_anon = {
        "session_id": "test-anon-002",
        "guest_name": "",
        "composite_score": 0.78,
        "tier": "whale",
        "is_whale": True,
        "service_interest": "",
        "nudge": {"type": "warm_nudge", "message": "Özel teklif", "cta": "Rezervasyon"},
        "behavioral_tags": ["high_intent"],
        "components": {"intent": 0.78, "recency": 0.7, "aov": 0.4, "behavior": 0.5},
    }
    result2 = await generate_sovereign_invite(mock_anon)
    assert result2["promo_code"].startswith("VIP-"), "FAIL: anon promo_code"
    print(f"  Promo: {result2['promo_code']} | Src: {result2['source']}")
    print("  ✅ PASS")

    print("\n" + "=" * 60)
    print("ALL AUTOPILOT TESTS PASSED! 🤖 Phase 18 Sovereign Invite LIVE.")
    print("=" * 60)

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_sovereign_invite())
