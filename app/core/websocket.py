import json
from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if websocket not in self.active_connections:
            self.active_connections.append(websocket)
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        if websocket not in self.rooms[room_id]:
            self.rooms[room_id].append(websocket)
        print(f"WS Connected to room: {room_id} (room size={len(self.rooms[room_id])})")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if room_id in self.rooms and websocket in self.rooms[room_id]:
            self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        print(f"WS Disconnected from room: {room_id}")

    def _evict(self, websocket: WebSocket, room_id: str):
        """Remove a dead socket silently (called from broadcast on error)."""
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            if room_id in self.rooms and websocket in self.rooms[room_id]:
                self.rooms[room_id].remove(websocket)
                if not self.rooms[room_id]:
                    del self.rooms[room_id]
        except Exception:
            pass

    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id not in self.rooms:
            return
        # Iterate over a snapshot to avoid mutation during loop
        dead = []
        for connection in list(self.rooms.get(room_id, [])):
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except Exception:
                dead.append((connection, room_id))
        for ws, rid in dead:
            self._evict(ws, rid)

    async def broadcast_global(self, message: dict):
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except Exception:
                dead.append(connection)
        for ws in dead:
            # evict from all rooms
            for rid in list(self.rooms.keys()):
                self._evict(ws, rid)
            if ws in self.active_connections:
                self.active_connections.remove(ws)

    async def broadcast_to_rooms(self, message: dict, room_ids: list):
        """Phase 18.5: Broadcast to multiple rooms at once (HQ + tenant channels)."""
        for room_id in room_ids:
            await self.broadcast_to_room(message, room_id)

manager = ConnectionManager()
