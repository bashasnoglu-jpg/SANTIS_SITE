"""
Phase 17: Oracle Unit Test — John Wick Whale Test
Validates the compute_oracle_score function and its composite scoring logic.
"""
import sys, os
sys.path.insert(0, os.getcwd())

from app.core.revenue_oracle import compute_oracle_score

print("=" * 60)
print("PHASE 17: REVENUE ORACLE — JOHN WICK WHALE TEST")
print("=" * 60)

# Test 1: John Wick — should be a Whale
r1 = compute_oracle_score(
    intent_score=90,
    session_duration_sec=250,
    page_depth=9,
    service_interest="vip ozel protokol",
    behavioral_tags=["high_intent", "returning_guest"],
    guest_name="John Wick",
    session_id="test-john-wick-001",
)
print(f"\n[Test 1] John Wick")
print(f"  Composite Score : {r1['composite_score']}")
print(f"  Tier            : {r1['tier']}")
print(f"  Is Whale        : {r1['is_whale']} {'🐋' if r1['is_whale'] else '❌'}")
print(f"  Nudge Type      : {r1['nudge']['type']}")
print(f"  Nudge CTA       : {r1['nudge']['cta']}")
print(f"  Components      : {r1['components']}")

assert r1["is_whale"], f"FAIL: John Wick must be a whale! Score={r1['composite_score']}"
assert r1["tier"] in ("whale", "hot_lead"), f"FAIL: Unexpected tier: {r1['tier']}"
print("  ✅ PASS")

# Test 2: Low intent guest — should NOT be a whale
r2 = compute_oracle_score(
    intent_score=25,
    session_duration_sec=10,
    page_depth=1,
    service_interest="",
    behavioral_tags=[],
    guest_name="Random Visitor",
    session_id="test-random-002",
)
print(f"\n[Test 2] Random Visitor")
print(f"  Composite Score : {r2['composite_score']}")
print(f"  Tier            : {r2['tier']}")
print(f"  Is Whale        : {r2['is_whale']}")
assert not r2["is_whale"], f"FAIL: Random visitor must NOT be a whale! Score={r2['composite_score']}"
print("  ✅ PASS")

# Test 3: Warm Lead
r3 = compute_oracle_score(
    intent_score=65,
    session_duration_sec=180,
    page_depth=5,
    service_interest="aromaterapik masaj",
    behavioral_tags=["warm_lead", "promo_holder"],
    guest_name="Ana Silva",
    session_id="test-warm-003",
)
print(f"\n[Test 3] Ana Silva (Warm Lead)")
print(f"  Composite Score : {r3['composite_score']}")
print(f"  Tier            : {r3['tier']}")
assert r3["composite_score"] > 0.0, "FAIL: Score must be positive"
print("  ✅ PASS")

print("\n" + "=" * 60)
print("ALL ORACLE TESTS PASSED! 🐋 Revenue Oracle is LIVE.")
print("=" * 60)
