from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class GodEyeManager:
    def __init__(self):
        # Sahadaki Müşteriler (Hayaletler)
        self.active_ghosts: Dict[str, WebSocket] = {}
        # Karargâh (Admin Radarları)
        self.command_centers: List[WebSocket] = []
        # Hayaletlerin Anlık Durum Hafızası
        self.ghost_states: Dict[str, dict] = {}

    async def connect_ghost(self, websocket: WebSocket, ghost_id: str):
        await websocket.accept()
        self.active_ghosts[ghost_id] = websocket
        self.ghost_states[ghost_id] = {"id": ghost_id, "status": "ONLINE", "page": "Bilinmiyor", "score": 0}
        print(f"👻 [Ghost Uplink] Hayalet Sahaya İndi: {ghost_id}")
        await self.broadcast_to_command({"type": "GHOST_UPDATE", "data": self.ghost_states[ghost_id]})

    async def disconnect_ghost(self, ghost_id: str):
        if ghost_id in self.active_ghosts:
            del self.active_ghosts[ghost_id]
        if ghost_id in self.ghost_states:
            del self.ghost_states[ghost_id]
        print(f"💨 [Ghost Vanished] Hayalet Radardan Çıktı: {ghost_id}")
        await self.broadcast_to_command({"type": "GHOST_VANISHED", "ghost_id": ghost_id})

    async def connect_command(self, websocket: WebSocket):
        await websocket.accept()
        self.command_centers.append(websocket)
        print("👁️ [God's Eye] Savaş Radarı Çevrimiçi!")
        # Karargâh bağlandığı an sahadaki tüm hayaletleri radara dök:
        await websocket.send_text(json.dumps({"type": "RADAR_SYNC", "data": list(self.ghost_states.values())}))

    def disconnect_command(self, websocket: WebSocket):
        if websocket in self.command_centers:
            self.command_centers.remove(websocket)
            print("🌑 [God's Eye] Savaş Radarı Kapatıldı.")

    async def process_telemetry(self, ghost_id: str, payload: dict):
        """Müşteriden gelen kalp atışlarını ve Kararsızlık (Hesitation) loglarını işler"""
        if ghost_id in self.ghost_states:
            self.ghost_states[ghost_id].update(payload)
            # Karargâha (Admin'e) milisaniyesinde yansıt!
            await self.broadcast_to_command({"type": "GHOST_UPDATE", "data": self.ghost_states[ghost_id]})

    async def broadcast_to_command(self, message: dict):
        """Sadece Karargâh ekranlarına sinyal fırlatır"""
        for connection in self.command_centers:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

    async def fire_divine_strike(self, ghost_id: str, strike_payload: dict):
        """THE OMEGA PROTOCOL: Admin'den gelen İkram/İndirim füzesini müşterinin ekranına çarptırır!"""
        if ghost_id in self.active_ghosts:
            ghost_ws = self.active_ghosts[ghost_id]
            try:
                await ghost_ws.send_text(json.dumps({"type": "DIVINE_STRIKE", "payload": strike_payload}))
                print(f"💥 [DIVINE STRIKE] Füze Hedefi Vurdu: {ghost_id}")
                return True
            except:
                return False
        return False

# Kuantum Hub'ı Başlat
radar_hub = GodEyeManager()

# 1. Müşterilerin (Front-End) Bağlanacağı Gizli Tünel
@router.websocket("/ws/ghost/{ghost_id}")
async def ghost_endpoint(websocket: WebSocket, ghost_id: str):
    await radar_hub.connect_ghost(websocket, ghost_id)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            await radar_hub.process_telemetry(ghost_id, payload)
    except WebSocketDisconnect:
        await radar_hub.disconnect_ghost(ghost_id)

# 2. Admin Panelinin (Savaş Odasının) Bağlanacağı Ana Tünel
@router.websocket("/ws/command-center")
async def command_endpoint(websocket: WebSocket):
    await radar_hub.connect_command(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            # Eğer Admin "Müdahale Et (İkram Fırlat)" butonuna basarsa:
            if payload.get("action") == "FIRE_STRIKE":
                target = payload.get("target_ghost")
                strike_data = payload.get("strike_data")
                await radar_hub.fire_divine_strike(target, strike_data)
    except WebSocketDisconnect:
        radar_hub.disconnect_command(websocket)
