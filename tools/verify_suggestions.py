
from sentinel_analytics import SentinelAnalytics
from sentinel_metrics import SentinelMetrics
from ai_suggestions import AISuggestionsEngine
import time
import json

print("Testing AI Optimization Engine...")

# Clear Metrics for testing
with open("reports/sentinel_metrics.json", "w") as f:
    f.write("[]")

# 1. Inject Degradation (to trigger Trend Analysis)
print("Injecting Performance Degradation...")
for _ in range(5): # Baseline
    SentinelMetrics.record({"response_time_ms": 100, "error_count": 0, "health_score": 100})
    time.sleep(0.01)
    
for _ in range(5): # Slow
    SentinelMetrics.record({"response_time_ms": 200, "error_count": 0, "health_score": 95})
    time.sleep(0.01)

# 2. Generate Suggestions
print("Generating Intelligence...")
suggestions = AISuggestionsEngine.generate()

print(f"\n🔮 Advice Generated: {len(suggestions)}")
print(json.dumps(suggestions, indent=2))

found_perf = any(s["title"] == "Performance Degradation Detected" for s in suggestions)

if found_perf:
    print("✅ AI correctly identified performance issue and suggested optimization.")
else:
    print("❌ AI missed the performance issue.")
