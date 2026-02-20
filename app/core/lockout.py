import time
import asyncio
import json
from typing import Dict, Tuple
from pathlib import Path

class LockoutManager:
    """
    SaaS Security Respond Layer: Persistent IP and Account-Based Brute Force Lockout
    Tracks failed login attempts and triggers a temporary ban (lockout)
    if the threshold is exceeded. Backed by JSON for startup persistence.
    """
    def __init__(self, max_attempts: int = 5, lockout_minutes: int = 15, storage_path: str = None):
        self.max_attempts = max_attempts
        self.lockout_seconds = lockout_minutes * 60
        self._lock = asyncio.Lock()
        
        if storage_path:
            self.storage_file = Path(storage_path)
        else:
            base_dir = Path(__file__).resolve().parent.parent.parent
            self.storage_file = base_dir / "assets" / "data" / "lockouts.json"
            
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        if not self.storage_file.parent.exists():
            self.storage_file.parent.mkdir(parents=True, exist_ok=True)
            
        if not self.storage_file.exists():
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def _load_records(self) -> Dict[str, list]:
        try:
            with open(self.storage_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save_records(self, data: Dict[str, list]):
        try:
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Failed to save lockouts.json: {e}")

    def _get_key(self, ip: str, username: str) -> str:
        return f"{ip}:{username}"

    async def check_lockout(self, ip: str, username: str) -> bool:
        """Returns True if the user/IP is currently locked out."""
        key = self._get_key(ip, username)
        async with self._lock:
            records = self._load_records()
            if key not in records:
                return False
                
            attempts, unlock_time = records[key]
            
            if time.time() < unlock_time:
                return True  # Still locked out
                
            # Lockout expired, reset the counter
            if unlock_time > 0 and time.time() >= unlock_time:
                del records[key]
                self._save_records(records)
                return False
                
            return False

    async def record_failure(self, ip: str, username: str) -> int:
        """Records a failed attempt and returns the remaining attempts before lockout."""
        key = self._get_key(ip, username)
        async with self._lock:
            records = self._load_records()
            record = records.get(key, [0, 0.0])
            attempts, unlock_time = record[0], record[1]
            
            # If already locked, do nothing
            if unlock_time > 0 and time.time() < unlock_time:
                return 0
                
            attempts += 1
            if attempts >= self.max_attempts:
                # Trigger Lockout
                new_unlock_time = time.time() + self.lockout_seconds
                records[key] = [attempts, new_unlock_time]
                self._save_records(records)
                return 0
                
            records[key] = [attempts, 0.0]
            self._save_records(records)
            return self.max_attempts - attempts

    async def clear_failures(self, ip: str, username: str):
        """Clears the failure record (e.g., upon successful login)."""
        key = self._get_key(ip, username)
        async with self._lock:
            records = self._load_records()
            if key in records:
                del records[key]
                self._save_records(records)

# Global singleton instance
lockout_manager = LockoutManager(max_attempts=5, lockout_minutes=15)
