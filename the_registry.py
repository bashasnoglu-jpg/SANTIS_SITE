import json
import os
import uuid
import logging
from datetime import datetime

# Setup Logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("TheRegistry")

class CitizenRegistry:
    """
    Santis Global Mirror - The Registry
    Manages unique Citizen IDs and profiles.
    """
    def __init__(self, data_file="data/citizens.json"):
        self.data_file = data_file
        self.events_file = "data/events.json"
        self.citizens = {}
        self.events = {}
        self._load_data()
        
        # Batch Write Logic
        self._dirty = False
        import threading
        import time
        self._lock = threading.Lock()
        
        def _auto_save_worker():
            while True:
                time.sleep(5)
                if self._dirty:
                    self._save_data()
                    
        # Start daemon thread to save data periodically
        self._saver_thread = threading.Thread(target=_auto_save_worker, daemon=True)
        self._saver_thread.start()

    def _load_data(self):
        """Loads citizen and event data from JSON."""
        # Citizens
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    self.citizens = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load registry: {e}")
                self.citizens = {}
        else:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            self.citizens = {}
            
        # Events
        if os.path.exists(self.events_file):
            try:
                with open(self.events_file, "r", encoding="utf-8") as f:
                    self.events = json.load(f)
            except Exception:
                self.events = {}
        else:
            self.events = {}

    def _save_data(self):
        """Saves registry and events to disk."""
        with self._lock:
            if not self._dirty:
                return
            
            try:
                with open(self.data_file, "w", encoding="utf-8") as f:
                    json.dump(self.citizens, f, indent=4)
                
                with open(self.events_file, "w", encoding="utf-8") as f:
                    json.dump(self.events, f, indent=4)
                    
                self._dirty = False
            except Exception as e:
                logger.error(f"Failed to save registry: {e}")

    def get_or_create(self, citizen_id=None, user_agent=None, ip=None):
        """
        Retrieves an existing citizen or registers a new one.
        Returns: (citizen_data, is_new)
        """
        is_new = False
        
        with self._lock:
            if not citizen_id or citizen_id not in self.citizens:
                citizen_id = str(uuid.uuid4())
                is_new = True
                self.citizens[citizen_id] = {
                    "id": citizen_id,
                    "created_at": datetime.now().isoformat(),
                    "last_seen": datetime.now().isoformat(),
                    "visits": 1,
                    "user_agent": user_agent,
                    "first_ip": ip,
                    "tags": ["NEWCOMER"],
                    "page_stats": {} # { "massage": 0, "hammam": 0, "general": 0 }
                }
                logger.info(f"🆕 New Citizen Registered: {citizen_id}")
                self._dirty = True
            else:
                # Update existing
                self.citizens[citizen_id]["last_seen"] = datetime.now().isoformat()
                self.citizens[citizen_id]["visits"] += 1
                if "page_stats" not in self.citizens[citizen_id]:
                    self.citizens[citizen_id]["page_stats"] = {}
                self._dirty = True
                
        # self._save_data() # Removed for batching
        return self.citizens[citizen_id], is_new

    def track_view(self, citizen_id, category):
        """Updates view count for a specific category."""
        with self._lock:
            if citizen_id in self.citizens:
                stats = self.citizens[citizen_id].get("page_stats", {})
                stats[category] = stats.get(category, 0) + 1
                self.citizens[citizen_id]["page_stats"] = stats
                self._dirty = True

    def get_citizen(self, citizen_id):
        return self.citizens.get(citizen_id)

    def get_active_citizens(self, minutes=30):
        """Returns list of citizens active in the last N minutes."""
        active = []
        now = datetime.now()
        for cid, data in self.citizens.items():
            try:
                last_seen = datetime.fromisoformat(data["last_seen"])
                if (now - last_seen).total_seconds() < (minutes * 60):
                    active.append(data)
            except Exception:
                pass
        return active

    def update_location(self, citizen_id, location_data):
        """Updates the location info for a citizen."""
        with self._lock:
            if citizen_id in self.citizens:
                self.citizens[citizen_id]["location"] = location_data
                self._dirty = True
                return True
        return False

    def stats(self):
        return {
            "total_citizens": len(self.citizens),
            "new_today": 0 # TODO: Implement time filter
        }
