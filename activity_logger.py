"""
📋 SANTIS Activity Logger v1.0
Captures all admin write operations (POST/PUT/DELETE) and saves them
to a rotating JSON log file for the Activity Feed dashboard.
"""

import json
import os
import time
import logging
from datetime import datetime, timezone
from pathlib import Path
from collections import deque

logger = logging.getLogger("santis.activity")

# --- Configuration ---
MAX_LOG_ENTRIES = 500       # Keep last 500 entries in JSON
MAX_MEMORY_BUFFER = 100     # In-memory cache for fast reads

# Action type mapping for human-readable labels
ACTION_LABELS = {
    "POST /api/bridge/save": "📝 Dosya Kaydedildi",
    "POST /api/services": "💆 Hizmetler Güncellendi",
    "DELETE /api/services/": "🗑️ Hizmet Silindi",
    "POST /admin/apply-fix": "🔧 Otomatik Düzeltme",
    "POST /admin/city/execute/": "🌃 City OS Protokolü",
    "POST /api/audit/run": "🔍 Audit Başlatıldı",
    "POST /api/gallery/save": "🖼️ Galeri Güncellendi",
    "POST /api/blog/": "📝 Blog Güncellendi",
    "POST /api/social/": "📢 Sosyal Medya Güncellendi",
    "POST /api/settings": "⚙️ Ayarlar Güncellendi",
    "POST /api/redirects": "🔗 Yönlendirme Eklendi",
}


class ActivityLogger:
    """Thread-safe activity logger with JSON persistence and memory buffer."""

    def __init__(self, data_dir: str):
        self.log_file = os.path.join(data_dir, "data", "activity-log.json")
        self.memory_buffer = deque(maxlen=MAX_MEMORY_BUFFER)
        self._ensure_file()
        self._load_recent()

    def _ensure_file(self):
        """Create log file if it doesn't exist."""
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
        if not os.path.exists(self.log_file):
            with open(self.log_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _load_recent(self):
        """Load recent entries into memory buffer on startup."""
        try:
            with open(self.log_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            for entry in data[-MAX_MEMORY_BUFFER:]:
                self.memory_buffer.append(entry)
            logger.info(f"📋 [Activity] Loaded {len(self.memory_buffer)} recent entries")
        except Exception as e:
            logger.error(f"📋 [Activity] Failed to load log: {e}")

    def _detect_label(self, method: str, path: str) -> str:
        """Match request to a human-readable action label."""
        key = f"{method} {path}"
        for pattern, label in ACTION_LABELS.items():
            if key.startswith(pattern):
                return label
        return f"🔹 {method} İstek"

    def _extract_detail(self, method: str, path: str, body: dict = None) -> str:
        """Generate a detail string from the request."""
        if "bridge/save" in path and body:
            return body.get("path", path)
        if "services" in path and body:
            if isinstance(body, list) and len(body) > 0:
                return f"{len(body)} hizmet"
            return body.get("name", body.get("slug", path))
        if "city/execute" in path:
            return path.split("/")[-1]
        if "apply-fix" in path and body:
            return body.get("fix_id", "")
        return path

    def log(self, method: str, path: str, status_code: int,
            body: dict = None, ip: str = "127.0.0.1",
            duration_ms: float = 0):
        """Record an activity entry."""
        try:
            entry = {
                "id": int(time.time() * 1000),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "method": method,
                "path": path,
                "status": status_code,
                "label": self._detect_label(method, path),
                "detail": self._extract_detail(method, path, body),
                "ip": ip,
                "duration_ms": round(duration_ms, 1),
            }

            # Add to memory buffer
            self.memory_buffer.append(entry)

            # Persist to file (append-safe)
            self._persist(entry)

            logger.info(f"📋 [Activity] {entry['label']}: {entry['detail']}")
        except Exception as e:
            logger.error(f"📋 [Activity] Log failed: {e}")

    def _persist(self, entry: dict):
        """Append entry to JSON file, with rotation."""
        try:
            with open(self.log_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = []

        data.append(entry)

        # Rotate: keep only last MAX_LOG_ENTRIES
        if len(data) > MAX_LOG_ENTRIES:
            data = data[-MAX_LOG_ENTRIES:]

        with open(self.log_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_recent(self, limit: int = 50, offset: int = 0) -> list:
        """Return recent entries from memory buffer (newest first)."""
        entries = list(self.memory_buffer)
        entries.reverse()
        return entries[offset:offset + limit]

    def get_stats(self) -> dict:
        """Return summary statistics."""
        entries = list(self.memory_buffer)
        if not entries:
            return {"total": 0, "today": 0, "labels": {}}

        today = datetime.now(timezone.utc).date().isoformat()
        today_count = sum(1 for e in entries if e["timestamp"][:10] == today)

        # Label frequency
        labels = {}
        for e in entries:
            lbl = e.get("label", "?")
            labels[lbl] = labels.get(lbl, 0) + 1

        return {
            "total": len(entries),
            "today": today_count,
            "labels": dict(sorted(labels.items(), key=lambda x: -x[1])[:5]),
            "last_action": entries[-1]["timestamp"] if entries else None,
        }
