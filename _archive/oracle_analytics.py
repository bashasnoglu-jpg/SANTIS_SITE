import logging
from datetime import datetime, timedelta

logger = logging.getLogger("OracleAnalytics")

class OracleEngine:
    """
    Santis Global Mirror - Oracle Analytics
    Analyzes Citizen Registry data to predict behavior and identify trends.
    """
    def __init__(self, registry):
        self.registry = registry

    def specific_insight(self, citizen_id):
        """
        Generates specific insights for a given citizen.
        """
        citizen = self.registry.get_citizen(citizen_id)
        if not citizen:
            return {"type": "unknown", "message": "Ziyaretçi tanınmıyor."}

        # Example Logic: visits > 3 -> Loyal
        # Interest Analysis
        page_stats = citizen.get("page_stats", {})
        top_interest = "General"
        if page_stats:
            top_interest = max(page_stats, key=page_stats.get).title()

        # Loyalty Analysis
        visits = citizen.get("visits", 1)
        if visits > 5:
            return {"type": "loyal", "message": f"Sadık Ziyaretçi ({top_interest} Tutkunu). VIP teklifi sunulabilir."}
        elif visits > 2:
            return {"type": "returning", "message": f"Tekrar gelen ziyaretçi. İlgi: {top_interest}"}
        else:
            return {"type": "new", "message": "Yeni potansiyel müşteri."}

    def global_pulse(self):
        """
        Returns high-level system stats.
        API: /api/oracle/status
        """
        try:
            active_citizens = self.registry.get_active_citizens(minutes=30)
            total = len(self.registry.citizens)
            
            # Simple Analysis
            top_country = "Unknown"
            countries = {}
            for c in active_citizens:
                cc = c.get("location", {}).get("country", "Unknown")
                countries[cc] = countries.get(cc, 0) + 1
            
            if countries:
                top_country = max(countries, key=countries.get)

            return {
                "status": "ONLINE",
                "active_now": len(active_citizens),
                "total_records": total,
                "top_region": top_country,
                "mood": "Calm", # Placeholder for future sentiment analysis
                "suggestion": {
                    "name": "General Wellness",
                    "type": "neutral"
                }
            }
        except Exception as e:
            logger.error(f"Oracle Pulse Error: {e}")
            return {"status": "ERROR", "message": str(e)}

    def get_recommendation(self, citizen_id):
        """
        Generates a personalized Smart Popup recommendation.
        Returns: { "show": bool, "title": str, "message": str, "action": str, "link": str }
        """
        citizen = self.registry.get_citizen(citizen_id)
        if not citizen:
            return {"show": False}

        # 1. Loyalty Check
        visits = citizen.get("visits", 1)
        page_stats = citizen.get("page_stats", {})
        top_interest = "general"
        if page_stats:
            top_interest = max(page_stats, key=page_stats.get)

        # LOYAL USER (>5 Visits) -> VIP Offer
        if visits > 5:
            return {
                "show": True,
                "type": "vip",
                "title": "👑 Özel Ayrıcalık",
                "message": f"Sadık bir misafirimiz olarak, {top_interest.title()} ritüellerinde %15 VIP indirimi sizinle.",
                "action": "İndirimi Kullan",
                "link": "/tr/rezervasyon/index.html?code=VIP15"
            }

        # RETURNING USER (>2 Visits) -> Interest Based
        elif visits > 2:
            if top_interest == "massage":
                return {
                    "show": True,
                    "type": "interest",
                    "title": "💆‍♀️ Rahatlama Zamanı?",
                    "message": "Favori masaj terapilerinizde bu hafta sonuna özel yerimiz var.",
                    "action": "Randevu Al",
                    "link": "/tr/masajlar/index.html"
                }
            elif top_interest == "hammam":
                return {
                    "show": True,
                    "type": "interest",
                    "title": "🧖‍♂️ Geleneksel Arınma",
                    "message": "Sultan Hamam paketimizde size özel bir ikramımız var.",
                    "action": "İncele",
                    "link": "/tr/hamam/index.html"
                }
            else:
                return {
                    "show": True,
                    "type": "general",
                    "title": "Tekrar Hoşgeldiniz",
                    "message": "Santis Club deneyimine kaldığınız yerden devam edin.",
                    "action": "Keşfet",
                    "link": "/tr/hizmetler/index.html"
                }

        # NEW USER -> Welcome
        else:
            # Language could be detected from geo_bridge (future)
            return {
                "show": True,
                "type": "welcome",
                "title": "Hoşgeldiniz",
                "message": "İlk ziyaretinize özel 'Tanışma Masajı' paketimizi incelediniz mi?",
                "action": "Fırsatı Gör",
                "link": "/tr/masajlar/index.html" # Fixed from /firsatlar.html which likely doesn't exist
            }

    def get_dynamic_layout(self, citizen_id):
        """
        Calculates homepage section order based on interest & loyalty.
        Returns: { "order": ["section_id", ...] }
        """
        citizen = self.registry.get_citizen(citizen_id)
        if not citizen:
            return {"order": ["global-trends", "journeys", "hammam", "masaj", "cilt", "products"]}

        # Default Order (Storytelling)
        sections = [
            {"id": "global-trends", "score": 20},
            {"id": "journeys",      "score": 18},
            {"id": "hammam",        "score": 15},
            {"id": "masaj",         "score": 15},
            {"id": "cilt",          "score": 12},
            {"id": "products",      "score": 10}
        ]

        # 1. Interest Score (+50 points to top interest)
        page_stats = citizen.get("page_stats", {})
        if page_stats:
            top_interest = max(page_stats, key=page_stats.get) # "massage", "hammam"...
            
            # Map interest to section ID
            interest_map = {
                "hammam": "hammam",
                "massage": "masaj",
                "ritual": "journeys",
                "skin": "cilt",
                "product": "products"
            }
            
            target_section = interest_map.get(top_interest)
            if target_section:
                for s in sections:
                    if s["id"] == target_section:
                        s["score"] += 50
                        logger.info(f"Oracle: Boosted {target_section} for {citizen_id} (Interest)")

        # 2. Loyalty Score (+30 points to Products/Atelier for Loyal users)
        visits = citizen.get("visits", 1)
        if visits > 5:
            for s in sections:
                if s["id"] == "products":
                    s["score"] += 30
                    logger.info(f"Oracle: Boosted products for {citizen_id} (Loyalty)")

        # Sort by Score Descending
        sections.sort(key=lambda x: x["score"], reverse=True)
        
        return {"order": [s["id"] for s in sections]}

        # 3. Determine Mood (Phase 34)
        mood = "neutral"
        if page_stats:
            top_interest = max(page_stats, key=page_stats.get)
            if top_interest in ["hammam", "massage"]:
                mood = "calm" # Relaxing
            elif top_interest in ["ritual", "skin"]:
                mood = "balanced" # Aesthetic/Care
            elif top_interest in ["private"]:
                mood = "romantic" # Couple/Private
        
        return {
            "order": [s["id"] for s in sections],
            "mood": mood
        }

    def log_event(self, event_type):
        """
        Logs a specific event for analytics (e.g., 'homepage_view').
        """
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.registry.events:
            self.registry.events[today] = {}
            
        self.registry.events[today][event_type] = self.registry.events[today].get(event_type, 0) + 1
        
        self.registry._save_data()

    def get_analytics_summary(self):
        """
        Aggregates data for Admin Dashboard (Ultra Mega Version).
        """
        total_citizens = len(self.registry.citizens)
        
        # Interest Distribution
        interests = {"def": 0}
        citizens = self.registry.citizens
        
        for cid, data in citizens.items():
            page_stats = data.get("page_stats", {})
            if page_stats:
                top = max(page_stats, key=page_stats.get)
                interests[top] = interests.get(top, 0) + 1
            else:
                interests["def"] += 1
                
        # Event Stats (Today)
        today = datetime.now().strftime("%Y-%m-%d")
        events_today = self.registry.events.get(today, {})
        
        # Dynamic Homepage Views
        dynamic_views = events_today.get("homepage_dynamic_view", 0)
        
        # Geo Distribution (Mock -> Real if we had logs)
        geo_stats = {
            "TR": 0, "DE": 0, "RU": 0, "EN": 0, "Other": 0
        }
        
        return {
            "total_users": total_citizens,
            "interest_stats": interests,
            "geo_stats": geo_stats,
            "dynamic_homepage_views": dynamic_views,
            "active_now": 1 # Placeholder
        }
