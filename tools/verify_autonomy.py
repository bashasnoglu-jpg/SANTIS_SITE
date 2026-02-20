
from sentinel_analytics import SentinelAnalytics
from sentinel_metrics import SentinelMetrics
from ai_suggestions import AISuggestionsEngine
from auto_optimizer import AutoOptimizer
import time
import json
import os

print("Testing Sentinel Autonomy (Phase 16)...")

# 1. Reset State
print("Resetting state...")
with open("reports/sentinel_metrics.json", "w") as f:
    f.write("[]")
with open("reports/sentinel_suggestions.json", "w") as f:
    f.write("[]")
with open("sentinel_config.json", "w") as f:
    json.dump({"performance": {"enable_gzip": False}}, f)

# 2. Inject Risk (Performance)
print("Injecting Risk...")
for _ in range(5): 
    SentinelMetrics.record({"response_time_ms": 100, "error_count": 0, "health_score": 100})
    time.sleep(0.01)
for _ in range(5): 
    SentinelMetrics.record({"response_time_ms": 300, "error_count": 0, "health_score": 90})
    time.sleep(0.01)

# 3. Generate Suggestion
print("Generating Suggestion...")
suggestions = AISuggestionsEngine.generate()
if not suggestions:
    print("❌ No suggestion generated!")
    exit(1)

target = suggestions[0]
print(f"✅ Suggestion Generated: {target['title']} (ID: {target['id']})")

# 4. Verify Config BEFORE
config_before = AutoOptimizer.load_config()
print(f"Config BEFORE: enable_gzip = {config_before['performance']['enable_gzip']}")

# 5. Apply Suggestion (Simulate Admin Click)
print(f"Applying Suggestion {target['id']}...")
result = AutoOptimizer.apply_suggestion(target['id'])
print(f"Result: {result}")

# 6. Verify Config AFTER
config_after = AutoOptimizer.load_config()
print(f"Config AFTER: enable_gzip = {config_after['performance']['enable_gzip']}")

# 7. Verify Status
queue = AutoOptimizer.load_suggestions()
updated_sug = next(s for s in queue if s['id'] == target['id'])
print(f"Suggestion Status: {updated_sug['status']}")

if config_after['performance']['enable_gzip'] == True and updated_sug['status'] == "applied":
    print("✅ SUCCESS: Sentinel successfully optimized the system configuration!")
else:
    print("❌ FAILURE: Configuration or status mismatch.")
