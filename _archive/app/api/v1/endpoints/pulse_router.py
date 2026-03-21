from __future__ import annotations
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from app.core.pulse import pulse_engine
from app.api.deps import get_current_user

router = APIRouter()

@router.websocket("/ws/{tenant_id}")
async def websocket_endpoint(websocket: WebSocket, tenant_id: str, token: str = None):
    # In a real app we need to check token via something like a custom verify_ws_token function
    # For now, we connect strictly
    await pulse_engine.connect(websocket, tenant_id)
    try:
        while True:
            # Listen to incoming messages (mainly for keeps-alive)
            data = await websocket.receive_text()
            # Respond to ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pulse_engine.disconnect(websocket, tenant_id)

@router.websocket("/ws/global/hq")
async def websocket_hq_endpoint(websocket: WebSocket, token: str = None):
    # Special God-Mode endpoint for HQ
    await pulse_engine.connect(websocket, "hq_global")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pulse_engine.disconnect(websocket, "hq_global")


