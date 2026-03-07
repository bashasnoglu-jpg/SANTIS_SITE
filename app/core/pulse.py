import asyncio
import logging
from typing import Dict, List, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger("santis_pulse")

# ==========================================
# 1. TENANT-ISOLATED WEBSOCKET MANAGER
# ==========================================
class SovereignSocketManager:
    def __init__(self):
        # Structure: {"tenant_id": [websocket1, websocket2, ...]}
        # HQ (Global Command) gets a special room: "hq_global"
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str):
        """Accept connection and seal client into their tenant room."""
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = []
        self.active_connections[tenant_id].append(websocket)
        logger.info(f"🟢 [Pulse] Connected. Room: {tenant_id}")

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        """Remove client from room on disconnect."""
        if tenant_id in self.active_connections:
            try:
                self.active_connections[tenant_id].remove(websocket)
                if not self.active_connections[tenant_id]:
                    del self.active_connections[tenant_id] # Free RAM
                logger.info(f"🔴 [Pulse] Disconnected. Room: {tenant_id}")
            except ValueError:
                pass

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        """RLS Shield: Broadcast data ONLY to the specified tenant."""
        if tenant_id in self.active_connections:
            # Iterate over a copy to safely remove dead sockets
            for connection in self.active_connections[tenant_id][:]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, tenant_id)

    async def broadcast_to_hq(self, message: dict):
        """God Mode: Broadcast global intel to 'hq_global' room."""
        await self.broadcast_to_tenant("hq_global", message)

# Singleton Pulse Manager
pulse_engine = SovereignSocketManager()


# ==========================================
# 2. EVENT DISPATCHER
# ==========================================
async def dispatch_event(tenant_id: str, event_type: str, payload: dict):
    """
    Called from anywhere in the system (e.g., Revenue, Bookings).
    Instantly reflects the event to the tenant's Black Room.
    """
    message = {
        "event": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": payload
    }
    await pulse_engine.broadcast_to_tenant(tenant_id, message)
    
    # VIP or Critical Alerts also mirror to HQ
    if event_type in ["SURGE_ACTIVATED", "VIP_BOOKING", "SCARCITY_ALERT", "RISK_ALERT"]:
        await pulse_engine.broadcast_to_hq({"tenant": tenant_id, **message})


# ==========================================
# 3. THE NIGHTLY ENGINE (AUTONOMOUS CRON)
# ==========================================
class NightlyScheduler:
    def __init__(self):
        self.is_running = False

    async def start(self):
        self.is_running = True
        logger.info("🌙 [Nightly Engine] Autonomous cycle awakened.")
        asyncio.create_task(self._loop())

    def stop(self):
        self.is_running = False
        logger.info("🛑 [Nightly Engine] Cycle halted.")

    async def _loop(self):
        while self.is_running:
            try:
                now = datetime.utcnow()
                # Run daily at 02:00 UTC
                if now.hour == 2 and now.minute == 0:
                    logger.info("🧠 [Nightly Engine] Phase Q: DNA Clustering & Oracle Forecast commencing...")
                    
                    # Compute overnight LTVs, cache analytics, etc.
                    # Notify HQ
                    await pulse_engine.broadcast_to_hq({
                        "event": "NIGHTLY_SYNC_COMPLETE",
                        "timestamp": now.isoformat()
                    })
                    
                    await asyncio.sleep(60) # Prevent multiple triggers in same minute
                
                await asyncio.sleep(30) # Poll every 30s
            except Exception as e:
                logger.error(f"⚠️ [Nightly Engine] Core Error: {e}")
                await asyncio.sleep(60)

nightly_scheduler = NightlyScheduler()
