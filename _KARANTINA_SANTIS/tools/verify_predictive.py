
from sentinel_analytics import SentinelAnalytics
from sentinel_metrics import SentinelMetrics
import time

print("Testing Predictive Sentinel...")

# Clear Metrics for testing
with open("reports/sentinel_metrics.json", "w") as f:
    f.write("[]")

# 1. Inject Baseline (Good Performance)
print("Injecting Baseline (100ms)...")
for _ in range(5):
    SentinelMetrics.record({"response_time_ms": 100, "error_count": 0, "health_score": 100})
    time.sleep(0.1)

# 2. Inject Recent (Bad Performance - 200ms)
print("Injecting Degradation (200ms)...")
for _ in range(5):
    SentinelMetrics.record({"response_time_ms": 200, "error_count": 0, "health_score": 95})
    time.sleep(0.1)

# 3. Analyze
print("Analyzing Trends...")
risk = SentinelAnalytics.analyze_trend()

if risk:
    print(f"✅ Risk Detected: {risk['type']}")
    print(f"📝 Message: {risk['message']}")
    if "PERFORMANCE_RISK" in risk['type']:
        print("✅ Detection Logic Verified.")
else:
    print("❌ No Risk Detected! Logic flaw?")
