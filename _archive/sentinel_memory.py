
import json
import os
import datetime
import logging
from typing import List, Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SentinelMemory")

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
REPORT_DIR = os.path.join(DIRECTORY, "reports")
LOG_FILE = os.path.join(REPORT_DIR, "sentinel_incidents.json")

class SentinelMemory:
    """
    Manages the persistent history of Sentinel actions and detections.
    """

    @staticmethod
    def _load() -> List[Dict[str, Any]]:
        if not os.path.exists(LOG_FILE):
            return []
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load memory: {e}")
            return []

    @staticmethod
    def _save(data: List[Dict[str, Any]]):
        os.makedirs(REPORT_DIR, exist_ok=True)
        try:
            with open(LOG_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save memory: {e}")

    @classmethod
    def record_incident(cls, issue: Dict[str, Any], status: str = "DETECTED", details: str = ""):
        """
        Records an incident to the log.
        """
        data = cls._load()
        
        # Create Incident Record
        incident = {
            "id": issue.get("issue_id") or f"INC-{int(datetime.datetime.now().timestamp())}",
            "time": datetime.datetime.now().isoformat(),
            "component": issue.get("category", "UNKNOWN"),
            "issue": issue.get("issue", "Unknown Issue"),
            "severity": issue.get("priority", "LOW"),
            "status": status, # DETECTED, FIXED, FAILED
            "details": details or issue.get("fix", ""),
            "auto_fix_possible": issue.get("auto_fix_safe", False)
        }
        
        # Prepend to list (newest first)
        data.insert(0, incident)
        
        # Context Window: Keep last 1000 incidents
        if len(data) > 1000:
            data = data[:1000]
            
        cls._save(data)
        logger.info(f"📝 Incident Recorded: {incident['issue']} [{status}]")

    @classmethod
    def get_recent(cls, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Returns recent incidents.
        """
        data = cls._load()
        return data[:limit]

if __name__ == "__main__":
    # Test
    SentinelMemory.record_incident({"issue": "Test Incident", "priority": "LOW"}, "TEST")
