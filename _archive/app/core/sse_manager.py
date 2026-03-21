# app/core/sse_manager.py - THE SOVEREIGN BUS (ULTRA MEGA UPDATE)
import asyncio
import json
from typing import AsyncGenerator

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

class SovereignBus:
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self.redis_pool = None
        self._memory_channels = {}
        self.use_redis = REDIS_AVAILABLE

    async def connect(self):
        """Sistemi Redis kalbine bağlar. (Fallback: InMemory)"""
        if not self.use_redis:
            print("⚡ [Sovereign Bus] Memory Heartbeat: ONLINE (Redis Unavailable)")
            return
            
        self.redis_pool = redis.from_url(self.redis_url, decode_responses=True)
        try:
            # Ping testi atıyoruz
            await self.redis_pool.ping()
            print("⚡ [Sovereign Bus] Redis Heartbeat: ONLINE")
        except Exception as e:
            print(f"⚠️ [Sovereign Bus] Redis Offline: {e}. Fallback Kalkanı (Memory) Aktif.")
            self.use_redis = False
            self.redis_pool = None

    async def broadcast(self, channel: str, message: dict):
        """Sinyali fırlatır ve unutur. (0 CPU yükü veya Queue Push)"""
        if self.use_redis is True and not self.redis_pool:
            await self.connect()
            
        data_str = json.dumps(message)
        
        if self.use_redis:
            try:
                await self.redis_pool.publish(channel, data_str)
            except Exception as e:
                # Redis aniden koparsa sessizce Memory'e geç
                self._memory_publish(channel, data_str)
        else:
            self._memory_publish(channel, data_str)

    def _memory_publish(self, channel: str, data_str: str):
        if channel in self._memory_channels:
            # Set iterating exception'ını önlemek için list()
            for q in list(self._memory_channels[channel]):
                try:
                    q.put_nowait(data_str)
                except asyncio.QueueFull:
                    pass

    async def listen(self, channel: str) -> AsyncGenerator[str, None]:
        """İstemciye giden asenkron mermi yolu."""
        if self.use_redis is True and not self.redis_pool:
            await self.connect()
            
        if self.use_redis:
            pubsub = self.redis_pool.pubsub()
            try:
                await pubsub.subscribe(channel)
                async for message in pubsub.listen():
                    if message['type'] == 'message':
                        # SSE formatında siber mermi
                        yield f"data: {message['data']}\n\n"
            except asyncio.CancelledError:
                await pubsub.unsubscribe(channel)
                print(f"🛑 [Sovereign Bus] İstemci ayrıldı. Kalkanlar aktif.")
            except Exception as e:
                print(f"🛑 [Sovereign Bus] Redis Bağlantısı Koptu: {e}")
        else:
            # Memory Fallback Listen Loop
            q = asyncio.Queue(maxsize=100)
            if channel not in self._memory_channels:
                self._memory_channels[channel] = set()
            self._memory_channels[channel].add(q)
            
            try:
                while True:
                    data = await q.get()
                    yield f"data: {data}\n\n"
            except asyncio.CancelledError:
                self._memory_channels[channel].discard(q)
                print(f"🛑 [Sovereign Bus] Memory İstemci ayrıldı.")

# Global Singleton
sse_bus = SovereignBus()
