"""
SANTIS OS — Admin Audit Logger v1.0
Phase 3: Security Hardening

Structured audit log for all admin actions.
Format: JSON Lines (append-only, line-delimited JSON)
Retention: 30 days auto-cleanup
"""

import os
import json
import time
import logging
from pathlib import Path
from datetime import datetime, timedelta

logger = logging.getLogger("SantisSecurity")


class AdminAuditLogger:
    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        self.log_dir = Path(base_dir) / "logs" / "admin_audit"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.retention_days = 30
        logger.info(f"📋 [AdminAudit] Log dir: {self.log_dir}")

    def _log_file(self) -> Path:
        """Daily log file: admin_audit_2026-02-14.jsonl"""
        today = datetime.now().strftime("%Y-%m-%d")
        return self.log_dir / f"admin_audit_{today}.jsonl"

    def log(self, action: str, user: str = "unknown", ip: str = "unknown",
            path: str = "", user_agent: str = "", detail: str = "", success: bool = True):
        """Append an audit entry."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "user": user,
            "ip": ip,
            "path": path,
            "user_agent": user_agent[:200] if user_agent else "",
            "detail": detail[:500] if detail else "",
            "success": success,
        }

        try:
            with open(self._log_file(), "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"📋 [AdminAudit] Write error: {e}")

    def get_recent(self, limit: int = 50) -> list:
        """Get recent audit entries (newest first)."""
        entries = []
        # Read today + yesterday
        for delta in range(3):
            date = (datetime.now() - timedelta(days=delta)).strftime("%Y-%m-%d")
            log_file = self.log_dir / f"admin_audit_{date}.jsonl"
            if log_file.exists():
                try:
                    with open(log_file, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                entries.append(json.loads(line))
                except Exception as e:
                    logger.error(f"📋 [AdminAudit] Read error: {e}")

        entries.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return entries[:limit]

    def cleanup_old(self):
        """Remove log files older than retention period."""
        cutoff = datetime.now() - timedelta(days=self.retention_days)
        removed = 0
        for f in self.log_dir.glob("admin_audit_*.jsonl"):
            try:
                date_str = f.stem.replace("admin_audit_", "")
                file_date = datetime.strptime(date_str, "%Y-%m-%d")
                if file_date < cutoff:
                    f.unlink()
                    removed += 1
            except (ValueError, OSError):
                pass
        if removed:
            logger.info(f"📋 [AdminAudit] Cleaned {removed} old log files")


# Singleton
admin_audit = AdminAuditLogger()
