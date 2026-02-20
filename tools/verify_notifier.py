
from sentinel_notifier import SentinelNotifier
import logging
import io

# Capture logs
log_capture = io.StringIO()
handler = logging.StreamHandler(log_capture)
handler.setFormatter(logging.Formatter('%(message)s'))
logging.getLogger("SentinelNotifier").addHandler(handler)

print("Testing Sentinel Notifier...")
SentinelNotifier.alert("Test Failure", "This is a simulated critical error.", 0xFF0000)

logs = log_capture.getvalue()
print("\n--- Captured Logs ---")
print(logs)

if "🚨 [SENTINEL ALERT] Test Failure: This is a simulated critical error" in logs:
    print("✅ Alert logged successfully.")
    if "Webhook not configured" in logs:
        print("✅ Correctly identified missing webhook.")
else:
    print("❌ Alert not logged!")
