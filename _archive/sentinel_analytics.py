
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List
import sentinel_memory
import sentinel_metrics

# Configuration
REPORT_DIR = "reports"
AUDIT_RESULT = os.path.join(REPORT_DIR, "audit_result.json")

class SentinelAnalytics:
    """
    Analyzes Sentinel Memory to produce high-level stats.
    """

    @staticmethod
    def get_summary(days: int = 7) -> Dict[str, Any]:
        """
        Returns a summary of system health for the last N days.
        """
        incidents = sentinel_memory.SentinelMemory.get_recent(1000) # Get widely
        now = datetime.now()
        threshold = now - timedelta(days=days)

        # Filter by date
        recent = [i for i in incidents if datetime.fromisoformat(i["time"]) > threshold]
        
        # Stats
        total_issues = len(recent)
        fixed_issues = len([i for i in recent if i["status"] == "FIXED"])
        failed_issues = len([i for i in recent if i["status"] == "FAILED"])
        detected_issues = len([i for i in recent if i["status"] == "DETECTED"])
        
        # Stability Score Calculation (Simple Model)
        # Base 100. Deduct for failures and detections. Fixed issues have low penalty.
        score = 100
        score -= (failed_issues * 5)
        score -= (detected_issues * 2)
        score -= (fixed_issues * 0.5)
        score = max(0, min(100, score)) # Clamp 0-100

        # Group by Component
        components = {}
        for i in recent:
            comp = i.get("component", "UNKNOWN")
            components[comp] = components.get(comp, 0) + 1

        # Current Audit Health (if available)
        current_health = "UNKNOWN"
        if os.path.exists(AUDIT_RESULT):
            try:
                with open(AUDIT_RESULT, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    current_health = data.get("summary", {}).get("health_score", "N/A")
            except:
                pass

        return {
            "period_days": days,
            "total_incidents": total_issues,
            "fixed": fixed_issues,
            "failed": failed_issues,
            "pending": detected_issues,
            "stability_score": int(score),
            "current_audit_score": current_health,
            "top_components": dict(sorted(components.items(), key=lambda item: item[1], reverse=True)[:5]),
            "generated_at": now.isoformat()
        }

    @staticmethod
    def analyze_trend():
        """
        Detects negative trends in system health.
        Returns a warning dict if a risk is detected, else None.
        """
        data = sentinel_metrics.SentinelMetrics.get_history(20)
        if len(data) < 5:
            return None

        # Split into Recent (latest 5) and Baseline (previous 5)
        recent = data[-5:]
        baseline = data[-10:-5]
        
        if not baseline:
            return None

        # 1. Performance Degradation (latency increase)
        avg_recent_lat = sum(d.get("response_time_ms", 0) for d in recent) / len(recent)
        avg_base_lat = sum(d.get("response_time_ms", 0) for d in baseline) / len(baseline)
        
        if avg_base_lat > 0:
            lat_change = ((avg_recent_lat - avg_base_lat) / avg_base_lat) * 100
            if lat_change > 25: # +25% slower
                return {
                    "type": "PERFORMANCE_RISK",
                    "message": f"Response time increased by {int(lat_change)}% (Avg: {int(avg_recent_lat)}ms)",
                    "severity": "WARNING"
                }

        # 2. Health Drift (score decrease)
        avg_recent_health = sum(d.get("health_score", 100) for d in recent) / len(recent)
        avg_base_health = sum(d.get("health_score", 100) for d in baseline) / len(baseline)

        if avg_recent_health < avg_base_health and avg_recent_health < 90:
             return {
                "type": "STABILITY_DRIFT",
                "message": f"Health Score degrading. Dropped from {int(avg_base_health)} to {int(avg_recent_health)}.",
                "severity": "WARNING"
            }
            
        return None

if __name__ == "__main__":
    print(SentinelAnalytics.get_summary())
