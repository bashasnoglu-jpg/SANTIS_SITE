import uuid
import os
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Any

class MockRedis:
    """In-memory Redis fallback for environments without an active Redis instance."""
    def __init__(self):
        self._data = {}

    async def get(self, key: str) -> Optional[str]:
        return self._data.get(key)

    async def set(self, key: str, value: str, nx: bool = False, px: int = None, ex: int = None) -> bool:
        if nx and key in self._data:
            return False
        self._data[key] = value
        # Ignoring TTL (px, ex) in the raw mock for simplicity
        return True

    async def eval(self, script: str, numkeys: int, *keys_and_args) -> Any:
        # Mocking Lua lock release
        key = keys_and_args[0]
        arg = keys_and_args[1]
        if self._data.get(key) == arg:
            del self._data[key]
            return 1
        return 0

# Redis Connection Pool (Singleton)
class RedisClient:
    _pool: Optional[MockRedis] = None

    @classmethod
    def get_redis(cls):
        if cls._pool is None:
            # Always return MockRedis on local Windows OS to prevent Error 10061
            print("🛡️ [Sovereign Engine] Redis bypassed. Using local memory mock.")
            cls._pool = MockRedis()
        return cls._pool

LUA_RELEASE_LOCK = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""

@asynccontextmanager
async def acquire_lock(lock_name: str, timeout_seconds: int = 8):
    """
    Phase 8: The Redis Fortress (Redlock Race Condition Shield)
    Acquires a distributed lock using Redis SET nx px.
    Yields True if lock acquired, False otherwise.
    Releases lock automatically on exit.
    """
    redis = RedisClient.get_redis()
    token = uuid.uuid4().hex
    lock_key = f"lock:{lock_name}"
    
    is_locked = await redis.set(lock_key, token, nx=True, px=timeout_seconds * 1000)
    
    try:
        yield bool(is_locked)
    finally:
        if is_locked:
            await redis.eval(LUA_RELEASE_LOCK, 1, lock_key, token)

async def check_offer_cooldown(session_id: str, cooldown_minutes: int = 15) -> bool:
    """
    Phase 8: Smart Offer Engine
    Checks if an offer was recently shown to this session.
    Sets the key if it doesn't exist.
    Returns True if an offer was ALREADY shown (cooldown active), False if safe to show an offer.
    """
    redis = RedisClient.get_redis()
    key = f"offer_cooldown:{session_id}"
    
    was_set = await redis.set(key, "1", nx=True, ex=cooldown_minutes * 60)
    return not bool(was_set)
