from __future__ import annotations
from fastapi import APIRouter, Request, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import time
import asyncio
from loguru import logger
from fastapi.responses import StreamingResponse

# [SOVEREIGN SEAL: ULTRA MEGA TELEMETRY INGESTION & SCORING]

router = APIRouter()

# 🚨 ZERO-LATENCY MEMORY 
# God Mode SSE akışı gücünü doğrudan bu RAM havuzundan çekecek!
SOVEREIGN_STATE = {
    "active_sessions": {}, 
    "total_revenue_sim": 4250.0  # Stripe bağlanana kadar simüle ciro
}

from typing import List, Optional

# --- KOGNİTİF ŞEMALAR (Pydantic Zırhı) ---
class HesitationEvent(BaseModel):
    price_id: str = "unknown"
    hesitation_ms: int = 0

class TelemetryPayload(BaseModel):
    client_id: str = "unknown"
    node_id: str = "index"
    mouse_moves: int = 0
    scroll_depth: int = 0
    hesitation_events: List[HesitationEvent] = []
    timestamp: int = 0

# --- ULTRA MEGA SKORLAMA MOTORU ---
async def process_cognitive_behavior(payload: TelemetryPayload, ip_address: str):
    """Arka planda (Background Task) çalışan analitik zeka."""
    
    now = time.time()
    session_id = f"{ip_address}_{payload.client_id}"
    
    # 1. Ziyaretçi profilini hafızaya al veya güncelle
    if session_id not in SOVEREIGN_STATE["active_sessions"]:
        SOVEREIGN_STATE["active_sessions"][session_id] = {
            "first_seen": now,
            "last_seen": now,
            "max_scroll": 0,
            "total_hesitation": 0,
            "is_whale": False
        }
        
    session = SOVEREIGN_STATE["active_sessions"][session_id]
    session["last_seen"] = now
    session["max_scroll"] = max(session["max_scroll"], payload.scroll_depth)
    
    # Kararsızlık (Hesitation) birikimini topla
    for event in payload.hesitation_events:
        session["total_hesitation"] += event.hesitation_ms
        
    # 2. 🐋 THE WHALE ALGORITHM (Moby Dick Radarı)
    dwell_time = now - session["first_seen"]
    
    # Sizin Kuralınız: Sitede 40sn kalmışsa, sayfanın %50'sini okumuşsa VE fiyatta 3 sn (3000ms) beklemişse -> WHALE!
    if dwell_time > 40 and session["max_scroll"] > 50 and session["total_hesitation"] > 3000:
        if not session["is_whale"]:
            logger.warning(f"🐋 [WHALE DETECTED] ID: {session_id} | Dwell: {int(dwell_time)}s | Kararsızlık: {session['total_hesitation']}ms")
        session["is_whale"] = True

    # 3. Kuantum Havuzunu Canlı SSE Kanalına (God Mode Panopticon) Pompala
    if payload.hesitation_events or session["is_whale"]:
        try:
            from app.core.sse_manager import sse_bus
            pulse_type = "WHALE_ALERT" if session["is_whale"] else "TELEMETRY_PULSE"
            pulse_action = "HEATING_UP" if payload.hesitation_events else "OBSERVING"
            
            await sse_bus.broadcast("santis_global_pulse", {
                "type": pulse_type,
                "action": pulse_action,
                "node_id": payload.node_id,
                "client_id": payload.client_id,
                "is_whale": session["is_whale"],
                "hesitation_events": [e.dict() for e in payload.hesitation_events],
                "scroll_depth": payload.scroll_depth
            })
        except Exception as e:
            logger.error(f"TELEMETRY_PULSE failed to broadcast: {e}")

@router.post("/ingest")
async def ingest_telemetry(payload: TelemetryPayload, request: Request, bg_tasks: BackgroundTasks):
    """JS Ajanından 5 saniyede bir gelen Kuantum Havuzu verisini işler."""
    client_ip = request.client.host if request.client else "unknown"
    
    # 🚨 ULTRA MEGA MİMARİ: Analizi ana thread'de YAPMIYORUZ!
    # Sunucu anında "202 Accepted" döner, işlemi arka planda yapar. API asla kilitlenmez!
    bg_tasks.add_task(process_cognitive_behavior, payload, client_ip)
    
    # --- PHASE 56: THE RICOCHET ---
    # Mevcut hafızayı (RAM) o saniyede kontrol et, Balina ise anında kancayı at!
    session_id = f"{client_ip}_{payload.client_id}"
    is_whale = False
    if session_id in SOVEREIGN_STATE["active_sessions"]:
        is_whale = SOVEREIGN_STATE["active_sessions"][session_id].get("is_whale", False)
        
    response_data = {"status": "ingested", "cognitive_ack": True}
    
    if is_whale:
        response_data["vip_intervention"] = True
        response_data["offer"] = "Sovereign Concierge Ayrıcalığı"
        response_data["reason"] = "Sessiz Lüks İlgi Tespit Edildi"
        
    return response_data

# --- PHASE 65: AURELIA MOCK (Lokal Testler) ---
class AureliaRequest(BaseModel):
    intent_score: int
    node: str

@router.post("/aurelia-mock")
async def aurelia_mock_stream(payload: AureliaRequest):
    """
    Kullanıcının Edge Worker'ı olmadığı lokal (localhost) durumlarda
    Aurelia'nın 404 hatasını önleyen ve Streaming API sağlayan sahte LLM akışı.
    """
    message = f"Bu bir sahte (mock) Aurelia uyanışıdır efendim. {payload.node} üzerindeki yüksek skorunuz ({payload.intent_score}) Sovereign radarlarımıza takıldı. Size özel Sovereign Suite Upgrade teklifimi değerlendirmek ister misiniz."
    
    async def string_stream_generator():
        # Daktilo simülasyonu için kelime kelime / harf harf akıtıyoruz
        words = message.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.08)  # 80ms gecikme ile daktilo efekti sağlar

    # Cloudflare Worker akışını birebir taklit eder:
    return StreamingResponse(
        string_stream_generator(), 
        media_type="text/event-stream", 
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
