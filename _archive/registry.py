
import json
import os
import uuid
import datetime
import logging
from pathlib import Path

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CityRegistry")

DATA_FILE = Path("data/city_residents.json")

class CityRegistry:
    def __init__(self):
        self.residents = {}
        self.load_residents()

    def load_residents(self):
        """Loads residents from JSON storage."""
        if not DATA_FILE.exists():
            self.residents = {}
            return

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                self.residents = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load registry: {e}")
            self.residents = {}

    def save_residents(self):
        """Saves residents to JSON storage."""
        try:
            DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.residents, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save registry: {e}")

    def get_or_create_citizen(self, citizen_id=None):
        """
        Retrieves a citizen profile or creates a new one.
        Returns (citizen_id, profile).
        """
        if not citizen_id or citizen_id not in self.residents:
            citizen_id = str(uuid.uuid4())
            self.residents[citizen_id] = {
                "created_at": datetime.datetime.now().isoformat(),
                "visits": 0,
                "interactions": [],
                "affinity": {},  # e.g., {"zen": 5, "midnight": 2}
                "last_seen": None
            }
            logger.info(f"🆕 New Citizen Registered: {citizen_id}")
            self.save_residents()
        
        return citizen_id, self.residents[citizen_id]

    def record_interaction(self, citizen_id, interaction_type, data):
        """
        Records an interaction (e.g., page_view, mood_exposure).
        """
        if citizen_id not in self.residents:
            return
            
        profile = self.residents[citizen_id]
        profile["visits"] += 1
        profile["last_seen"] = datetime.datetime.now().isoformat()
        
        # Track Mood Affinity
        if interaction_type == "mood_exposure":
            mood = data.get("mood")
            if mood:
                profile["affinity"][mood] = profile["affinity"].get(mood, 0) + 1
                
        # Keep log short (last 50 interactions)
        profile["interactions"].append({
            "type": interaction_type,
            "data": data,
            "timestamp": datetime.datetime.now().isoformat()
        })
        profile["interactions"] = profile["interactions"][-50:]
        
        self.save_residents()

    def get_global_analytics(self):
        """
        Aggregates data for the World Table.
        """
        total_citizens = len(self.residents)
        mood_counts = {}
        country_counts = {}
        active_now = 0
        
        # Simple threshold for "Active Now" (last 5 mins)
        five_mins_ago = (datetime.datetime.now() - datetime.timedelta(minutes=5)).isoformat()

        for pid, data in self.residents.items():
            # Check Activity
            if data.get("last_seen", "") > five_mins_ago:
                active_now += 1
            
            # Aggregate Mood Affinity (Dominant mood per user)
            if data.get("affinity"):
                dominant_mood = max(data["affinity"], key=data["affinity"].get)
                mood_counts[dominant_mood] = mood_counts.get(dominant_mood, 0) + 1
                
            # Aggregate Location (from interactions)
            # Find last interaction with location
            last_loc = "Unknown"
            for i in reversed(data.get("interactions", [])):
                if "location" in i.get("data", {}):
                    last_loc = i["data"]["location"].get("country", "Unknown")
                    break
            
            country_counts[last_loc] = country_counts.get(last_loc, 0) + 1

        return {
            "total_citizens": total_citizens,
            "active_now": active_now,
            "mood_distribution": mood_counts,
            "country_distribution": country_counts
        }

# Singleton
registry = CityRegistry()
