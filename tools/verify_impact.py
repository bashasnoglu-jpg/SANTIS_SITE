
from sentinel_metrics import SentinelMetrics
from ai_suggestions import AISuggestionsEngine
from auto_optimizer import AutoOptimizer
import time
import json
import os
import shutil

print("Testing Sentinel Impact Learning (Phase 17)...")

# 1. Reset State
print("Resetting state...")
with open("reports/sentinel_metrics.json", "w") as f: f.write("[]")
with open("reports/sentinel_suggestions.json", "w") as f: f.write("[]")
with open("reports/sentinel_impact_log.json", "w") as f: f.write("[]")
if os.path.exists("reports/temp_baselines"): shutil.rmtree("reports/temp_baselines")

# 2. SCENARIO: POSITIVE IMPACT
print("\n--- SCENARIO 1: POSITIVE IMPACT ---")

# A. Baseline (Slow)
print("Injecting Trend Data...")
for _ in range(5):
    SentinelMetrics.record({"response_time_ms": 100, "error_count": 0, "health_score": 100})
    time.sleep(0.01)
for _ in range(5):
    SentinelMetrics.record({"response_time_ms": 300, "error_count": 5, "health_score": 80})
    time.sleep(0.01)
print("Recorded Baseline Trend (Deteriorating)")

# B. Generate Suggestion
sug = AISuggestionsEngine.generate()[0]
print(f"Generated: {sug['title']} ({sug['id']})")

# C. Apply
res = AutoOptimizer.apply_suggestion(sug['id'])
print(f"Applied: {res['message']}")

# Simulate time passing (Hack: update timestamp in suggestions.json to 2 mins ago)
sugs = AutoOptimizer.load_suggestions()
sugs[0]["applied_at"] = "2020-01-01T00:00:00" # LONG AGO
AutoOptimizer.save_suggestions(sugs)

# D. New State (Fast)
SentinelMetrics.record({"response_time_ms": 50, "error_count": 0, "health_score": 95})
print("Recorded New State (Fast: 50ms, 0 errors)")

# E. Verify
print("Verifying Impact...")
AutoOptimizer.verify_optimization(sug['id'])

# Check Log
log = AutoOptimizer.load_impact_log()[0]
print(f"✅ Result: {log['impact_score']} (Score: {log['score_val']})")
if log['impact_score'] != "POSITIVE":
    print("❌ Failed Positive Test")
    exit(1)

# 3. SCENARIO: NEGATIVE IMPACT
print("\n--- SCENARIO 2: NEGATIVE IMPACT ---")

# Reset suggestions for new one
with open("reports/sentinel_metrics.json", "w") as f: f.write("[]")

# A. Baseline (Fast)
SentinelMetrics.record({"response_time_ms": 50, "error_count": 0, "health_score": 95})

# B. Create Fake Suggestion manually
neg_id = "opt_negative_test"
sugs = AutoOptimizer.load_suggestions()
sugs.append({
    "id": neg_id, 
    "title": "Bad Change", 
    "action_key": "performance.enable_gzip", 
    "proposed_value": False,
    "status": "pending"
})
AutoOptimizer.save_suggestions(sugs)

# C. Apply
AutoOptimizer.apply_suggestion(neg_id)

# Hack Time
sugs = AutoOptimizer.load_suggestions()
target = next(s for s in sugs if s['id'] == neg_id)
target["applied_at"] = "2020-01-01T00:00:00"
AutoOptimizer.save_suggestions(sugs)

# D. New State (Slow - Regression)
SentinelMetrics.record({"response_time_ms": 500, "error_count": 2, "health_score": 70})
print("Recorded Regression (Climbed to 500ms)")

# E. Verify
AutoOptimizer.verify_optimization(neg_id)

# Check Log
log = AutoOptimizer.load_impact_log()[1]
print(f"✅ Result: {log['impact_score']} (Score: {log['score_val']})")
if log['impact_score'] != "NEGATIVE":
    print("❌ Failed Negative Test")
    exit(1)

print("\n🎉 SUCCESS: Sentinel correctly identifies Positive and Negative impacts!")
