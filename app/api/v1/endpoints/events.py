from __future__ import annotations
import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from pprint import pprint
from typing import Any, List, Dict
import logging
import datetime
import asyncio
from jose import jwt
from app.core.config import settings
from app.core.websocket import manager

from app.db.session import get_db, AsyncSessionLocal
from app.db.models.content import ContentEdge

logger = logging.getLogger(__name__)
router = APIRouter()

# Phase F: Event Buffer (Replaces direct DB hits for scaling)
EVENT_BUFFER = asyncio.Queue()
BATCH_SIZE = 50

class InteractionEvent(BaseModel):
    guest_id: str
    recommended_slug: str
    interaction: str # "purchased", "ignored", "viewed"
    context: str = "guest_zen_tablet"

async def flush_event_buffer():
    """
    Worker that drains the buffer and commits to PostgreSQL in batches.
    Prevents lock contention during high telemetry volumes.
    """
    if EVENT_BUFFER.empty():
        return
        
    events_to_process: List[InteractionEvent] = []
    
    while not EVENT_BUFFER.empty() and len(events_to_process) < BATCH_SIZE:
        try:
            event = await asyncio.wait_for(EVENT_BUFFER.get(), timeout=0.1)
            events_to_process.append(event)
        except asyncio.TimeoutError:
            break
            
    if not events_to_process:
        return
        
    async with AsyncSessionLocal() as db:
        for event in events_to_process:
            stmt = select(ContentEdge).where(
                ContentEdge.source_id == event.guest_id,
                ContentEdge.target_id == event.recommended_slug,
                ContentEdge.source_type == "guest",
                ContentEdge.target_type == "service"
            )
            result = await db.execute(stmt)
            edge = result.scalar_one_or_none()
            
            if event.interaction == "purchased":
                weight_delta = 5
                if not edge:
                     edge = ContentEdge(
                         source_id=event.guest_id,
                         source_type="guest",
                         edge_type="purchased",
                         target_id=event.recommended_slug,
                         target_type="service",
                         weight=1,
                         metadata_json={"source": event.context, "ai_driven": True}
                     )
                     db.add(edge)
            elif event.interaction == "ignored":
                weight_delta = -1
            elif event.interaction == "viewed":
                weight_delta = 1
            else:
                weight_delta = 0
                
            if edge and event.interaction != "purchased":
                 await db.execute(
                     update(ContentEdge)
                     .where(ContentEdge.id == edge.id)
                     .values(weight=ContentEdge.weight + weight_delta)
                 )
        await db.commit()
    logger.info(f"Santis Engine: Flushed {len(events_to_process)} events to Graph.")

@router.post("/interaction")
async def log_interaction(event: InteractionEvent) -> Any:
    """
    O(1) Memory Push. API returns instantly.
    """
    EVENT_BUFFER.put_nowait(event)
    return {"status": "buffered", "queue_size": EVENT_BUFFER.qsize()}

# ----------------------------------------------------------------------------------
# 🛡️ SOVEREIGN THE ORACLE (Phase 15.2)
# Zırhlı Event Batcher & JWT Imzalayıcı (Never Trust The Client)
# ----------------------------------------------------------------------------------

class SantisClientEvent(BaseModel):
    type: str
    payload: Dict[str, Any]
    timestamp: int

class SantisBatchRequest(BaseModel):
    session_id: str
    events: List[SantisClientEvent]

# Phase 15.3 (MVP): The Oracle In-Memory State. (Redis gelene kadar)
# "Never Trust The Client" prensibi gereği toplam skor sunucuda tutulur.
oracle_memory_state: Dict[str, int] = {}

# The Score Engine - Server Side Truth Matrix
SERVER_SCORE_MATRIX = {
    "time_15s": 10,
    "hover_deep": 15,
    "scroll_25": 5,
    "scroll_50": 10,
    "scroll_75": 15,
    "scroll_90": 20,
    "card_view": 5,
    "cta_click": 20,
    "modal_open": 30,
    "gallery_open": 15
}

@router.post("/batch", tags=["Sovereign The Oracle"])
async def process_event_batch(req: SantisBatchRequest):
    """
    Kriptografik Otonom Veri İşleyici: Frontend'in fırlattığı 5'li mermileri (Batch)
    karşılar, Orijinal sunucu katsayılarına göre niyet skoru hesaplar (God Mode Koruması) 
    ve HS256 JWT mühürü ile imzalar. İstemci artık skoru manipüle edemez.
    """
    total_delta = 0
    intervention_count = 0
    
    # İstemci Olaylarını (Events) Deşifre Et
    for ev in req.events:
        event_type = ev.type
        payload = ev.payload
        
        # Sadece Olayları (Hover, Scroll vs.) doğrulayıp Puan Ver (Güven Sınırı: Server)
        if event_type == "score_update" and "action" in payload:
            action = payload["action"]
            if action in SERVER_SCORE_MATRIX:
                 total_delta += SERVER_SCORE_MATRIX[action]
                 
        if event_type == "aurelia_deployed":
            intervention_count += 1
            
    # Toplam Skoru In-Memory olarak güncelle (MVP)
    if req.session_id not in oracle_memory_state:
        oracle_memory_state[req.session_id] = 0
    oracle_memory_state[req.session_id] += total_delta
    
    # 💥 PROTOKOL 15.6: THE ORACLE SCORE CAP & INTENT TIER 💥
    oracle_memory_state[req.session_id] = min(oracle_memory_state[req.session_id], 100)
    current_total_score = oracle_memory_state[req.session_id]
    
    intent_tier = "SURGE" if current_total_score >= 85 else ("RESCUE" if current_total_score >= 70 else "OBSERVE")
            
    # TODO: İleride Redis / Shadow UUID üzerinden state çekilecek (Phase V20)
    # Şimdilik Frontend'i kilitlemeden imzalı bir "Niyet Jetonu" veriyoruz
    
    current_time = datetime.datetime.utcnow()
    expire = current_time + datetime.timedelta(hours=24) # 24 saat kalıcı hafıza (Digital Amnesia Patch)
    
    jwt_payload = {
        "session": req.session_id,
        "delta": total_delta,
        "score": current_total_score,
        "tier": intent_tier,
        "trusted_oracle": True,
        "interventions": intervention_count,
        "exp": expire
    }
    
    # Cryptographic Seal (HMAC-SHA256)
    oracle_signature = jwt.encode(jwt_payload, settings.SECRET_KEY, algorithm="HS256")
    
    logger.info(f"💎 [The Oracle] Processed {len(req.events)} events for {req.session_id} - Oracle Delta: +{total_delta}")
    
    # ----------------------------------------------------------------------------------
    if total_delta > 0 or intervention_count > 0:
        try:
             asyncio.create_task(manager.broadcast_to_room({
                "type": "TELEMETRY_BEACON",
                "session_id": req.session_id,
                "current_score": current_total_score, 
                "tier": intent_tier,
                "persona": "Sovereign Target" if intent_tier == "SURGE" else "Standard Guest",
                "timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
            }, "hq_global"))
        except Exception as e:
            logger.error(f"Watchtower Broadcast Error (The Oracle): {e}")

    return {
        "status": "Oracle Authorized",
        "processed_events": len(req.events),
        "signed_intent": oracle_signature,
        "oracle_delta": total_delta
    }

