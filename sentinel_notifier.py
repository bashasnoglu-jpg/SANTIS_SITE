
import os
import json
import logging
import requests
import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SentinelNotifier")

class SentinelNotifier:
    """
    Handles external notifications for Sentinel.
    Currently supports Discord Webhooks.
    """
    
    WEBHOOK_URL = os.environ.get("SENTINEL_WEBHOOK_URL", "")

    @classmethod
    def alert(cls, title: str, message: str, color: int = 0xFF0000):
        """
        Sends an alert.
        color: Hex color integer (e.g. 0xFF0000 for Red, 0xFFA500 for Orange)
        """
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_msg = f"🚨 [SENTINEL ALERT] {title}: {message}"
        
        # Always log locally
        logger.warning(log_msg)

        # Send to Webhook if configured
        if cls.WEBHOOK_URL:
            try:
                payload = {
                    "username": "Santis Sentinel",
                    "avatar_url": "https://i.imgur.com/4M34hi2.png", # Optional: Sentinel Avatar
                    "embeds": [{
                        "title": f"🚨 {title}",
                        "description": message,
                        "color": color,
                        "footer": {"text": f"Santis Autonomous System • {timestamp}"}
                    }]
                }
                requests.post(cls.WEBHOOK_URL, json=payload, timeout=5)
            except Exception as e:
                logger.error(f"Failed to send webhook: {e}")
        else:
            logger.info("(Webhook not configured. Set SENTINEL_WEBHOOK_URL to enable remote alerts.)")

if __name__ == "__main__":
    SentinelNotifier.alert("Test Alert", "This is a test message from Sentinel.", 0x00FF00)
