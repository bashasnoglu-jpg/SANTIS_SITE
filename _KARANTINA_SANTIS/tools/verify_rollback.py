
from sentinel_metrics import SentinelMetrics
from ai_suggestions import AISuggestionsEngine
from auto_optimizer import AutoOptimizer
import time
import json
import os
import shutil

print("Testing Sentinel Auto-Rollback (Phase 18)...")

# 1. Reset State
print("Resetting state...")
with open("reports/sentinel_metrics.json", "w") as f: f.write("[]")
with open("reports/sentinel_suggestions.json", "w") as f: f.write("[]")
with open("reports/sentinel_impact_log.json", "w") as f: f.write("[]")
with open("reports/sentinel_state.json", "w") as f: 
    json.dump({"rollbacks_today": 0, "last_reset_date": "", "last_rollback_at": None}, f)
if os.path.exists("reports/temp_baselines"): shutil.rmtree("reports/temp_baselines")

# Ensure Config matches 'before' state
config = AutoOptimizer.load_config()
config["performance"]["enable_gzip"] = False
AutoOptimizer.save_config(config)

# 2. SCENARIO: AUTO-ROLLBACK
print("\n--- SCENARIO: SEVERE DEGRADATION -> ROLLBACK ---")

# A. Baseline
SentinelMetrics.record({"response_time_ms": 50, "error_count": 0, "health_score": 95})

# B. Suggestion (Enable Gzip)
sug_id = "opt_rollback_test"
suggestions = [{
    "id": sug_id, 
    "title": "Enable Gzip", 
    "action_key": "performance.enable_gzip", 
    "proposed_value": True,
    "status": "pending",
    "confidence": 0.9,
    "problem": "Test",
    "suggestion": "Test",
    "expected_impact": "High"
}]
AutoOptimizer.save_suggestions(suggestions)

# C. Apply (Changes config to True)
print("Applying Suggestion (Config -> True)...")
AutoOptimizer.apply_suggestion(sug_id)

config_applied = AutoOptimizer.load_config()
print(f"Config is now: {config_applied['performance']['enable_gzip']}")
if not config_applied['performance']['enable_gzip']:
    print("❌ Config failed to update!")
    exit(1)

# D. Inject Severe Degradation (Score: -500+)
# 50ms -> 600ms = -550 score
print("Injecting Severe Failure...")
# Hack timestamp
sugs = AutoOptimizer.load_suggestions()
sugs[0]["applied_at"] = "2020-01-01T00:00:00"
AutoOptimizer.save_suggestions(sugs)

SentinelMetrics.record({"response_time_ms": 600, "error_count": 0, "health_score": 40})

# E. Verify (Should trigger Rollback)
print("Verifying Impact (Should Rollback)...")
AutoOptimizer.verify_optimization(sug_id)

# F. Check Config (Should be False)
config_final = AutoOptimizer.load_config()
print(f"Config is now: {config_final['performance']['enable_gzip']}")

if config_final['performance']['enable_gzip'] == False:
    print("✅ SUCCESS: Config was rolled back!")
else:
    print("❌ FAILURE: Config stayed True!")
    exit(1)

# G. Check Logs
logs = AutoOptimizer.load_impact_log()
last_log = logs[-1]
print(f"Last Log Event: {last_log.get('event', 'impact_check')}")

if last_log.get('event') == 'rollback_executed':
    print("✅ Rollback correctly logged!")
else:
    print("❌ Rollback log missing!")
    exit(1)

print("\n🎉 Sentinel Self-Correction Verified!")
