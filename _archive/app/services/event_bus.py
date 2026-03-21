import asyncio
import logging
from typing import Dict, Any, Optional
import uuid

from app.db.session import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.event import SovereignEvent
from app.core.pulse import dispatch_event

logger = logging.getLogger("santis_event_bus")

class SovereignEventBus:
    """
    Sovereign Enterprise Event Bus:
    Fire-and-forget asynchronous backend event logging.
    Records metric data to PostgreSQL while immediately 
    dispatching real-time signals via WebSocket without blocking the main event loop.
    """

    @staticmethod
    def emit(
        event_name: str,
        payload: Dict[str, Any],
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        device_fingerprint: Optional[str] = None
    ) -> None:
        """
        Non-blocking emit. Fires an asyncio background task immediately.
        """
        asyncio.create_task(SovereignEventBus._process_event(
            event_name=event_name,
            payload=payload,
            tenant_id=tenant_id,
            user_id=user_id,
            session_id=session_id,
            device_fingerprint=device_fingerprint
        ))

    @staticmethod
    async def _process_event(
        event_name: str,
        payload: Dict[str, Any],
        tenant_id: Optional[str],
        user_id: Optional[str],
        session_id: Optional[str],
        device_fingerprint: Optional[str]
    ) -> None:
        """
        Internal async worker. 
        1. Writes to the PostgreSQL events table.
        2. Pipes the event to the Pulse engine.
        """
        try:
            # 1. Database Write (The System of Record)
            async_session = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            async with async_session() as db:
                event = SovereignEvent(
                    tenant_id=uuid.UUID(tenant_id) if tenant_id else None,
                    user_id=user_id,
                    session_id=session_id,
                    event_name=event_name,
                    metadata_payload=payload,
                    device_fingerprint=device_fingerprint
                )
                db.add(event)
                await db.commit()
                
            # 2. WebSocket Broadcast (The Pulse)
            if tenant_id:
                # We format standard pulse triggers the ECharts engine can capture
                pulse_event_type = "SURGE_ACTIVATED" if "surge" in event_name.lower() else "VIP_BOOKING"
                
                # In our God Mode setup or standard tenant setup, we intercept via `dispatch_event`
                await dispatch_event(
                    tenant_id=tenant_id,
                    event_type=pulse_event_type,
                    payload={"action": "FLARE", "event_name": event_name, **payload}
                )
                
            logger.debug(f"EventBus -> Emitted {event_name} successfully.")
                
        except Exception as e:
            # Swallow the error so it never breaks the user's booking/API flow
            logger.error(f"EventBus Delivery Failure for {event_name}: {str(e)}")

# Singleton access
EventBus = SovereignEventBus()
