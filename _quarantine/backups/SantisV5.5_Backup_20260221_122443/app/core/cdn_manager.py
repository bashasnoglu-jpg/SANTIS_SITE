import httpx
import asyncio
from app.core.config import settings
from typing import List, Optional
import logging

class CDNManager:
    """
    Blok E: Edge & CDN Layer (Phase E1)
    Handles automated Cache Invalidation/Purge for Cloudflare Networks.
    Ensures that when content is updated or rolled back, the global Edge cache is busted instantly.
    """
    
    def __init__(self):
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        # In a real setup, ZONE_ID is required to purge cache for a domain.
        # For now, we simulate the success if credentials are not fully provided.
        # We fetch it from env or just use a dummy one if empty.
        self.zone_id = getattr(settings, "CLOUDFLARE_ZONE_ID", None)
        self.base_url = "https://api.cloudflare.com/client/v4"
        
        self.logger = logging.getLogger("santis.cdn_manager")

    async def purge_by_urls(self, urls: List[str]) -> bool:
        """
        Purges specific URLs from the Cloudflare cache.
        Returns True if successful or simulated success.
        """
        if not self.api_token or not self.zone_id:
            self.logger.warning(f"CDN_PURGE_WARN: Missing Token or ZoneID. Simulating purge for {len(urls)} URLs: {urls}")
            return True

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "files": urls
        }
        
        url = f"{self.base_url}/zones/{self.zone_id}/purge_cache"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=5.0)
                
                if response.status_code == 200:
                    self.logger.info(f"CDN_PURGE_SUCCESS: Purged {len(urls)} URLs.")
                    return True
                else:
                    self.logger.error(f"CDN_PURGE_ERROR: HTTP {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            self.logger.error(f"CDN_PURGE_EXCEPTION: Failed to reach CDN API -> {str(e)}")
            return False

    async def purge_by_tags(self, tags: List[str]) -> bool:
        """
        Purges Cache-Tags (Enterprise Cloudflare only).
        """
        if not self.api_token or not self.zone_id:
            self.logger.warning(f"CDN_PURGE_TAG_WARN: Simulating purge for tags: {tags}")
            return True
            
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "tags": tags
        }
        
        url = f"{self.base_url}/zones/{self.zone_id}/purge_cache"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=5.0)
                if response.status_code == 200:
                    self.logger.info(f"CDN_PURGE_TAG_SUCCESS: Purged tags {tags}.")
                    return True
                return False
        except Exception as e:
            self.logger.error(f"CDN_PURGE_TAG_EXCEPTION: {str(e)}")
            return False

cdn_manager = CDNManager()
