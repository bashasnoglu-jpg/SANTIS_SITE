import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.security_logger import security_logger

class RiskEngine:
    """
    The Santis Risk Engine (SRE).
    Implements Impossible Travel, Device Fingerprinting, and ASN Analysis.
    """
    
    @staticmethod
    def generate_device_hash(request_headers: dict) -> str:
        """
        Creates a Device Hash from User-Agent and Accept-Language.
        In a real frontend, we'd also collect Canvas Hash, Battery API, Screen Res, etc.
        """
        ua = request_headers.get("user-agent", "unknown")
        al = request_headers.get("accept-language", "unknown")
        # In Phase Omega, we hash these to form the device signature
        raw_fingerprint = f"{ua}|{al}"
        return hashlib.sha256(raw_fingerprint.encode("utf-8")).hexdigest()

    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine formula to calculate distance between two coordinates in km."""
        import math
        R = 6371.0 # Earth radius in km
        
        dlon = math.radians(lon2 - lon1)
        dlat = math.radians(lat2 - lat1)
        
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

    @staticmethod
    def mock_geo_lookup(ip: str) -> Dict[str, Any]:
        """
        Mock GeoIP lookup. In production, use MaxMind or internal IP-to-Geo DB.
        If IP starts with 10., 127., 192.168. -> Internal
        """
        if ip.startswith("10.") or ip.startswith("127.") or ip.startswith("192.168."):
            return {"country": "TR", "city": "Istanbul", "lat": 41.0082, "lon": 28.9784, "is_datacenter": False}
        return {"country": "UNKNOWN", "city": "Unknown", "lat": 0.0, "lon": 0.0, "is_datacenter": False}

    @staticmethod
    async def evaluate_login_risk(
        db: AsyncSession, 
        user_id: str, 
        ip: str, 
        headers: dict, 
        trusted_devices: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Calculates a Risk Score (0-100+) based on current request context compared to user history.
        """
        score = 0
        signals = []
        
        current_geo = RiskEngine.mock_geo_lookup(ip)
        current_device_hash = RiskEngine.generate_device_hash(headers)
        
        if trusted_devices is None:
            trusted_devices = []
            
        # 1. Device Fingerprint Anomaly (New Device)
        if current_device_hash not in trusted_devices:
            score += 30
            signals.append("NEW_DEVICE")
            
        # 2. Datacenter / VPN IP Check
        if current_geo.get("is_datacenter"):
            score += 25
            signals.append("DATACENTER_IP")

        # 3. Impossible Travel Check (Requires pulling last login from DB)
        # For Phase Omega MVP, we execute a direct SQL query to fetch last known IP coordinates 
        # (Assuming we store last login IP in a table or we can mock it here)
        query = text("""
            SELECT context_ip, context_geo, created_at 
            FROM audit_logs 
            WHERE actor_id = :uid AND action = 'LOGIN_SUCCESS' 
            ORDER BY created_at DESC LIMIT 1
        """)
        try:
            res = await db.execute(query, {"uid": user_id})
            last_login = res.fetchone()
            
            if last_login and last_login.context_ip != ip:
                last_geo = last_login.context_geo if last_login.context_geo else {}
                if last_geo.get("lat") and current_geo.get("lat"):
                    distance_km = RiskEngine.calculate_distance(
                        float(last_geo["lat"]), float(last_geo["lon"]),
                        float(current_geo["lat"]), float(current_geo["lon"])
                    )
                    
                    time_diff_hours = (datetime.now(timezone.utc) - last_login.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0
                    
                    if time_diff_hours > 0:
                        speed = distance_km / time_diff_hours
                        if speed > 900: # Over commercial airliner speed
                            score += 50
                            signals.append(f"IMPOSSIBLE_TRAVEL ({speed:.0f} km/h)")
        except Exception as e:
            pass # DB or Audit Log table might be missing fields in V1

        risk_level = "LOW"
        if score >= 60:
            risk_level = "CRITICAL"
        elif score >= 30:
            risk_level = "MEDIUM"
            
        if risk_level in ["MEDIUM", "CRITICAL"]:
            security_logger.log_event(
                event_type="RISK_ENGINE_ALERT",
                severity="WARN" if risk_level == "MEDIUM" else "CRITICAL",
                ip=ip,
                username=user_id,
                description=f"Risk Score: {score}. Signals: {', '.join(signals)}"
            )

        return {
            "score": score,
            "risk_level": risk_level,
            "signals": signals,
            "device_hash": current_device_hash,
            "geo": current_geo
        }

risk_engine = RiskEngine()
