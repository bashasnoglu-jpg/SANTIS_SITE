
import json
import os
from datetime import datetime

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
REPORT_DIR = os.path.join(DIRECTORY, "reports")
METRICS_PATH = os.path.join(REPORT_DIR, "sentinel_metrics.json")

class SentinelMetrics:
    """
    Time-Machine for Sentinel. Records system pulse over time.
    """

    @staticmethod
    def _ensure():
        os.makedirs(REPORT_DIR, exist_ok=True)
        if not os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "w", encoding="utf-8") as f:
                json.dump([], f)

    @staticmethod
    def record(snapshot):
        """
        Records a single snapshot of system health.
        snapshot = {
            "response_time_ms": float,
            "error_count": int,
            "health_score": int
        }
        """
        SentinelMetrics._ensure()
        try:
            with open(METRICS_PATH, "r+", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = []
                
                # Add timestamp
                snapshot["time"] = datetime.now().isoformat()
                data.append(snapshot)
                
                # Prune (Keep last 500)
                if len(data) > 500:
                    data = data[-500:]

                f.seek(0)
                json.dump(data, f, indent=2)
                f.truncate()
        except Exception as e:
            print(f"Failed to record metrics: {e}")

    @staticmethod
    def get_history(limit=50):
        SentinelMetrics._ensure()
        try:
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data[-limit:]
        except:
            return []
    
    @staticmethod
    def get_current():
        """Returns the latest metric snapshot."""
        history = SentinelMetrics.get_history(1)
        if history:
            return history[-1] 
        return {"response_time_ms": 0, "error_count": 0, "health_score": 100} 

if __name__ == "__main__":
    SentinelMetrics.record({"response_time_ms": 120, "error_count": 0, "health_score": 100})
