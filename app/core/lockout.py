import time
import asyncio
from typing import Dict, Tuple

class LockoutManager:
    """
    SaaS Security Respond Layer: IP and Account-Based Brute Force Lockout
    Tracks failed login attempts and triggers a temporary ban (lockout)
    if the threshold is exceeded.
    """
    def __init__(self, max_attempts: int = 5, lockout_minutes: int = 15):
        self.max_attempts = max_attempts
        self.lockout_seconds = lockout_minutes * 60
        
        # In-memory storage: { "ip:email": (attempts, unlock_timestamp) }
        # For a production SaaS with multiple workers, this should be backed by Redis.
        self._records: Dict[str, Tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    def _get_key(self, ip: str, username: str) -> str:
        return f"{ip}:{username}"

    async def check_lockout(self, ip: str, username: str) -> bool:
        """Returns True if the user/IP is currently locked out."""
        key = self._get_key(ip, username)
        async with self._lock:
            if key not in self._records:
                return False
                
            attempts, unlock_time = self._records[key]
            
            if time.time() < unlock_time:
                return True  # Still locked out
                
            # Lockout expired, reset the counter
            if unlock_time > 0 and time.time() >= unlock_time:
                del self._records[key]
                return False
                
            return False

    async def record_failure(self, ip: str, username: str) -> int:
        """Records a failed attempt and returns the remaining attempts before lockout."""
        key = self._get_key(ip, username)
        async with self._lock:
            attempts, unlock_time = self._records.get(key, (0, 0.0))
            
            # If already locked, do nothing (should have been caught by check_lockout)
            if unlock_time > 0 and time.time() < unlock_time:
                return 0
                
            attempts += 1
            if attempts >= self.max_attempts:
                # Trigger Lockout
                new_unlock_time = time.time() + self.lockout_seconds
                self._records[key] = (attempts, new_unlock_time)
                return 0
                
            self._records[key] = (attempts, 0.0)
            return self.max_attempts - attempts

    async def clear_failures(self, ip: str, username: str):
        """Clears the failure record (e.g., upon successful login)."""
        key = self._get_key(ip, username)
        async with self._lock:
            if key in self._records:
                del self._records[key]

# Global singleton instance
lockout_manager = LockoutManager(max_attempts=5, lockout_minutes=15)
