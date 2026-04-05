import json
import os
import time
from pathlib import Path
from datetime import datetime

class SecurityAuditLogger:
    """
    SaaS Security Detect Layer: Structured Security Logger
    Writes 401, 403, 429 and Brute-Force lockout events into a structured JSON trail.
    """
    def __init__(self, log_path: str = None):
        if log_path:
            self.log_file = Path(log_path)
        else:
            base_dir = Path(__file__).resolve().parent.parent.parent
            self.log_file = base_dir / "assets" / "data" / "security_audit_trail.json"
            
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        if not self.log_file.parent.exists():
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            
        if not self.log_file.exists():
            with open(self.log_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def log_event(self, event_type: str, severity: str, ip: str, username: str, description: str):
        """
        Logs a security event to the JSON file.
        event_type: e.g. "RATE_LIMIT", "LOGIN_FAILED", "LOCKOUT", "INVALID_JWT"
        severity: "INFO", "WARN", "CRITICAL"
        """
        try:
            with open(self.log_file, "r+", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = []
                
                event = {
                    "id": f"evt_{int(time.time() * 1000)}",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "type": event_type,
                    "severity": severity,
                    "ip": ip,
                    "username": username,
                    "description": description
                }
                
                # Prepend the event to keep the newest at the top
                data.insert(0, event)
                
                # Keep only the last 500 events to prevent massive file bloat
                if len(data) > 500:
                    data = data[:500]
                    
                f.seek(0)
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.truncate()
        except Exception as e:
            print(f"Failed to write Security Audit Log: {str(e)}")

# Global Singleton Instance 
security_logger = SecurityAuditLogger()
