import asyncio
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.db.session import engine
from app.db.models.content import OutboxEvent
from app.core.websocket import manager
from app.core.logger import log_event

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class EventDispatcher:
    """
    Phase D: Global Event Bus Dispatcher
    Reads from the OutboxEvent table and ensures "At-Least-Once" delivery
    to remote edge caches and WebSocket neural bridges.
    """
    def __init__(self):
        self.running = False
        self._task = None

    def start(self):
        if not self.running:
            self.running = True
            self._task = asyncio.create_task(self._process_loop())
            print("🚀 Santis Global Event Bus: Dispatcher Started.")

    def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            print("🛑 Santis Global Event Bus: Dispatcher Stopped.")

    async def _process_loop(self):
        while self.running:
            try:
                await self._process_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"⚠️ Event Dispatcher Error: {e}")
            await asyncio.sleep(2) # Polling interval

    async def _process_batch(self):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with SessionLocal() as session:
                    # 1. Acquire Lock on Pending Events
                    try:
                        stmt = select(OutboxEvent).where(OutboxEvent.status == "PENDING").with_for_update(skip_locked=True).limit(50)
                        result = await session.execute(stmt)
                    except Exception:
                        stmt = select(OutboxEvent).where(OutboxEvent.status == "PENDING").limit(50)
                        result = await session.execute(stmt)
                        
                    events = result.scalars().all()
                    
                    if not events:
                        return
                        
                    for event in events:
                        # 2. Dispatch the event
                        await self._handle_event(event)

                        # 3. Mark Event as Processed
                        event.status = "PROCESSED"
                        event.processed_at = datetime.utcnow()
                    
                    # 4. Commit Processed Status
                    await session.commit()
                break # Success, escape retry loop
            except Exception as e:
                import sys
                error_str = str(e)
                if "database is locked" in error_str.lower() and attempt < max_retries - 1:
                    await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
                    continue
                else:
                    print(f"⚠️ Event Dispatcher Error (Attempt {attempt+1}): {e}", file=sys.stderr)
                    break

    async def _handle_event(self, event: OutboxEvent):
        # The frontend listens for various sync payloads
        slug = event.payload.get("slug", "unknown")
        region = event.payload.get("region", "tr")

        # ── Guard: skip events with unresolved tenant slugs ───────────────
        # These are orphaned OutboxEvents created without a valid tenant context.
        # Broadcasting them spams the log with "unknown (tr)" noise.
        if not slug or slug == "unknown":
            return  # Silently skip — will be marked PROCESSED by caller

        payload = {
            "type": "GLOBAL_SYNC",
            "action": event.event_type,
            "slug": slug,
            "hash": event.payload.get("hash", ""),
            "region": region,
        }

        # Fire to all HQ and Guest nodes
        await manager.broadcast_global(payload)

        prefix = "📡 [Global Event Bus]" if event.event_type == "CONTENT_PUBLISHED" else "⏪ [Global Event Bus]"
        print(f"{prefix} Broadcasting Sync for {slug} ({region})")

# Singleton instance
event_dispatcher = EventDispatcher()
