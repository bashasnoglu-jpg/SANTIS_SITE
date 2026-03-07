import requests
import logging

logger = logging.getLogger("GeoBridge")

class GeoBridge:
    """
    Santis Global Mirror - GeoBridge
    Resolves IP to Location using IP-API.
    """
    def __init__(self):
        self.cache = {}

    def resolve(self, ip):
        """
        Returns location data for an IP.
        """
        # Localhost / Private IP Simulation
        if ip in ["127.0.0.1", "::1", "localhost"]:
            return {"country": "Turkey", "city": "Istanbul (Local)", "countryCode": "TR", "timezone": "Europe/Istanbul"}
        
        # Check cache
        if ip in self.cache:
            return self.cache[ip]

        try:
            # Using ip-api.com (free, non-commercial use)
            # Timeout is crucial to not block the request
            response = requests.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,city,timezone,lat,lon", timeout=3)
            data = response.json()
            
            if data.get("status") == "fail":
                logger.warning(f"GeoIP Lookup Failed for {ip}: {data.get('message')}")
                return {"country": "Unknown", "city": "Unknown", "countryCode": "XX"}
                
            result = {
                "country": data.get("country"),
                "city": data.get("city"),
                "countryCode": data.get("countryCode"),
                "timezone": data.get("timezone"),
                "lat": float(data.get("lat") or 0.0),
                "lon": float(data.get("lon") or 0.0)
            }
            
            self.cache[ip] = result
            return result
            
        except Exception as e:
            logger.error(f"GeoIP Error: {e}")
            return {"country": "Unknown", "city": "Unknown", "countryCode": "XX"}
