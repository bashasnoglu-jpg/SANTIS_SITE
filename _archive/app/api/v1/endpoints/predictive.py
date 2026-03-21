from __future__ import annotations
"""
app/api/v1/endpoints/predictive.py
Phase S - Predictive Offers (The Silent Closer)
Processes user visual intent and dispatches flash offers via the neural stream.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db, get_db_for_admin
from app.core.websocket import manager
from datetime import datetime, timedelta
import random

# Phase P & T: In-Memory Intent Tracker
# guest_id -> {"history": [{"category": "hamam", "timestamp": obj, "duration": 5}], "last_offer_time": timestamp}
active_intents = {}

# In a real system, these would be robust engines checking DB
async def mock_get_current_multiplier(service_id: str) -> float:
    return 1.1

async def mock_get_stock_status(service_id: str) -> int:
    # Randomize stock for demonstration of scarcity
    return random.choice([1, 2, 5, 10])

router = APIRouter()

def evaluate_intent(guest_id: str, new_category: str, duration: int):
    """
    Phase P & T: Analyzes sequence of intents, applies decay, 
    calculates confidence, and identifies DNA persona.
    """
    now = datetime.utcnow()
    
    if guest_id not in active_intents:
        active_intents[guest_id] = {"history": [], "last_offer_time": None}
        
    history = active_intents[guest_id]["history"]
    
    # 1. Intent Decay (Remove interactions older than 10 mins)
    decay_threshold = now - timedelta(minutes=10)
    history = [h for h in history if h["timestamp"] > decay_threshold]
    
    # Don't add consecutive duplicates unless significant time passed
    if not history or history[-1]["category"] != new_category:
        history.append({"category": new_category, "timestamp": now, "duration": duration})
        
    # Keep only last 5 interactions
    if len(history) > 5:
        history.pop(0)
        
    active_intents[guest_id]["history"] = history
    
    # 2. Sequence Velocity & Confidence Calculation
    # Base confidence mostly driven by duration (e.g. 3s = 65%, 6s = 80%)
    base_confidence = min(85, 50 + (duration * 5)) 
    # Velocity bonus for multiple intents in short time
    sequence_bonus = 5 * (len(history) - 1)
    confidence_score = min(99, base_confidence + sequence_bonus)

    categories = [h["category"] for h in history]
    
    # 3. Semantic Matching Logic & Persona (Phase P Map)
    persona = "Quiet Luxury"
    package_key = new_category

    if "hamam" in categories and "cilt" in categories:
        package_key = "the_purification_ritual" 
        persona = "Aesthetic Elite"
    elif "masaj" in categories and "cilt" in categories:
        package_key = "the_renewal_journey"     
        persona = "Recovery Athlete"
    elif new_category == "masaj":
        persona = "Recovery Athlete"
    elif new_category in ["hamam", "cilt"]:
        persona = "Aesthetic Elite"
        
    return package_key, confidence_score, persona

@router.post("/intent")
async def register_visual_intent(
    payload: dict = Body(...),
    db: Session = Depends(get_db_for_admin)
):
    """
    Phase S/T/U: Registers visual intent, evaluates intent vectors,
    generates an authentic flash offer with a ticking clock, 
    and whispers to the HQ neural stream.
    Expected payload: {"category": "hamam", "duration_seconds": 6, "guest_id": "session_xyz"}
    """
    try:
        raw_category = payload.get("category", "unknown")
        duration = payload.get("duration_seconds", 0)
        guest_id = payload.get("guest_id", "Anonymous")

        # 1. Base Evaluation
        if duration < 3:
            return {"status": "ignored", "reason": "duration too short"}

        # 2. Phase P + T: Sequence Analysis & Decay
        package_key, confidence_score, persona = evaluate_intent(guest_id, raw_category, duration)
        
        # Guard against spamming
        last_offer = active_intents[guest_id].get("last_offer_time")
        if last_offer and (datetime.utcnow() - last_offer).total_seconds() < 60:
             return {"status": "ignored", "reason": "offer cooldown active"}
        
        active_intents[guest_id]["last_offer_time"] = datetime.utcnow()

        # 3. Phase U: Autonomous Flash Sale
        package_names = {
            "the_purification_ritual": "The Purification Ritual (Hammam + Skincare)",
            "the_renewal_journey": "The Renewal Journey (Massage + Skincare)",
            "hamam": "Deep Heat Hammam",
            "masaj": "Signature Therapy",
            "cilt": "Sothys Radiance"
        }
        
        service_name = package_names.get(package_key, raw_category.title())
        flash_multiplier = 0.85 if "ritual" in package_key or "journey" in package_key else 0.90
        
        # Scarcity integration from Phase O
        stock = await mock_get_stock_status(raw_category)
        scarcity_text = f"Only {stock} VIP slot{'s' if stock > 1 else ''} left. " if stock <= 2 else ""
        
        # The Ticking Clock (Valid for seconds)
        flash_validity_seconds = 180 if stock <= 2 else 300

        # DNA-based Contextual Whisper (Phase P)
        context_msgs = {
            "Aesthetic Elite": f"Santis Intelligence: A rare slot has opened. Ready for an aesthetic touch of purification? Unlock <b>{service_name}</b> at a privileged {flash_multiplier}x multiplier. {scarcity_text}",
            "Recovery Athlete": f"Santis Intelligence: An ideal specialist is available right now for your muscle recovery. Secure <b>{service_name}</b> at a privileged {flash_multiplier}x multiplier. {scarcity_text}",
            "Quiet Luxury": f"Santis Intelligence: We've curated a bespoke offer for you based on your focus. Unlock <b>{service_name}</b> at a privileged {flash_multiplier}x multiplier. {scarcity_text}"
        }
        offer_message = context_msgs.get(persona, context_msgs["Quiet Luxury"])

        # 4. Neural HQ Whisper
        vector_str = " + ".join([h["category"] for h in active_intents[guest_id]["history"]])
        hq_whisper = (
            f"Santis Predictive ∷ High Intent ({raw_category}) - Confidence: {confidence_score}%. "
            f"Sequence [{vector_str}] detected for {guest_id}. "
            f"Triggering Contextual Whisper ('{persona}')..."
        )
        
        try:
            await manager.broadcast_to_room({
                "type": "NEURAL_THOUGHT",
                "message": hq_whisper,
                "level": "surge",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            }, "hq_global")
        except Exception:
            pass # Keep it invisible

        return {
            "status": "offer_generated",
            "offer": {
                "message": offer_message,
                "discount_multiplier": flash_multiplier,
                "valid_for_seconds": flash_validity_seconds,
                "category": package_key,
                "is_package": package_key not in ["hamam", "masaj", "cilt"]
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class ExitIntentPayload(BaseModel):
    session_id: str
    intent_score: int
    current_cart_value: float

# ==============================================================================
# PHASE V7: THE BLACK ROOM (DYNAMIC SKU & YIELD OPTIMIZATION)
# ==============================================================================
    
class BlackRoomRequest(BaseModel):
    session_id: str       # Örn: ghost_vip_3A8F9C1
    current_score: int    # Örn: 135
    # TODO: Machine Learning context for visited URLs

from app.core.websocket import manager  # Sovereign Command Center Kancası
import asyncio

@router.post("/black-room-offer")
async def generate_black_room_offer(payload: BlackRoomRequest):
    """
    Sovereign Black Room: Reads intent score and Sovereign Fingerprint,
    generates a unique Virtual SKU (Package) dynamically.
    """
    # KURAL 1: Lüks Herkese Sunulmaz (Score 70 barajı)
    if payload.current_score < 70:
        return {"status": "ignored", "message": "Score too low for The Black Room."}

    # KURAL 2: Niyetin Derinliği
    intent_level = "surge" if payload.current_score >= 95 else "awakened"

    # KURAL 3: Dinamik Paket Sentezleyici
    if intent_level == "surge":
        title = "Sovereign Executive: Arınma ve Işıltı Ritüeli"
        desc = f"Hizmetlerimize olan eşsiz ilginizi fark ettik. Sadece sizin kimliğinize ({payload.session_id[-6:].upper() if len(payload.session_id) > 6 else payload.session_id}) özel, Bali Masajı ve Sothys Cilt Bakımını VIP odamızda birleştirdik."
        base_price = 280 # Euro
        discount = 0.20 # %20 İndirim
        token = "SURGE-EXEC-20"
    else:
        title = "Premium Kombinasyon: Kapsamlı Yenilenme"
        desc = "Kısa bir mola vermeye ne dersiniz? Sizin için en uygun spa ve hamam ritüellerini tek bir pakette harmanladık."
        base_price = 150 # Euro
        discount = 0.10 # %10 İndirim
        token = "VIP-AWAKEN-10"

    # Fiyat ve Sanal Ürün Kodu (Virtual SKU) Hesaplaması
    dynamic_price = int(base_price * (1 - discount))
    import hashlib, time
    from datetime import datetime
    timestamp_hash = hashlib.md5(str(time.time()).encode()).hexdigest()[:5].upper()
    virtual_sku = f"PKG-{timestamp_hash}-{payload.session_id[-4:].upper() if len(payload.session_id) > 4 else payload.session_id}"

    # ==============================================================================
    # PHASE V8: THE SOVEREIGN COMMAND CENTER INTELLIGENCE PULSE
    # Ziyaretçiye paket ayrıldığında Komuta Merkezine canlı fırlat
    # ==============================================================================
    try:
        asyncio.create_task(manager.broadcast_to_room({
            "type": "BLACK_ROOM_EXECUTION",
            "session_id": payload.session_id,
            "intent_level": intent_level,
            "score": payload.current_score,
            "offer": {
                "sku": virtual_sku,
                "price": dynamic_price,
                "token": token
            },
            "timestamp": datetime.utcnow().strftime("%H:%M:%S")
        }, "hq_global"))
    except Exception as e:
        print(f"Watchtower Broadcast Error: {e}")

    return {
        "status": "success",
        "intent_level": intent_level,
        "offer": {
            "title": "💎 " + title,
            "description": desc,
            "virtual_sku": virtual_sku,
            "dynamic_price": dynamic_price,
            "original_price": base_price,
            "discount_percentage": int(discount * 100),
            "expires_in": 900,  # 15dk
            "token": token
        }
    }

@router.post("/exit-intent")
async def handle_exit_intent(
    payload: ExitIntentPayload,
    db: Session = Depends(get_db_for_admin)  # Depending on session could be async
):
    """
    Phase 8: Autonomous Offer Engine (Ghost Retargeting & Exit Intent)
    Saves retreating high-intent guests with a dynamic flash offer.
    """
    if payload.intent_score < 80:
        return {"status": "ignored", "reason": "intent_score_too_low"}
        
    from app.core.redis import check_offer_cooldown
    cooldown_active = await check_offer_cooldown(payload.session_id, cooldown_minutes=15)
    
    if cooldown_active:
         return {"status": "ignored", "reason": "cooldown_active"}
         
    # Dynamic Tiers based on Intent Score
    discount_pct = 5
    if payload.intent_score >= 95:
        discount_pct = 10
    elif payload.intent_score >= 90:
        discount_pct = 8
        
    # Generate unique ghost code
    import uuid
    ghost_code = f"SURGE-{discount_pct}-{uuid.uuid4().hex[:6].upper()}"
    
    # Broadcast to HQ for visualization
    try:
        hq_whisper = (
            f"Santis Predictive ∷ High-intent exit detected (Score: {payload.intent_score}). "
            f"Value: €{payload.current_cart_value}. "
            f"Dispatched Flash Surge Discount ({discount_pct}%): {ghost_code}"
        )
        await manager.broadcast_to_room({
            "type": "NEURAL_THOUGHT",
            "message": hq_whisper,
            "level": "alert",
            "timestamp": datetime.utcnow().strftime("%H:%M:%S")
        }, "hq_global")
    except Exception:
        pass
        
    return {
        "status": "offer_dispatched",
        "offer": {
            "message": f"Wait! A personalized {discount_pct}% VIP allowance has been granted. Use code {ghost_code} in the next 15 minutes.",
            "discount_code": ghost_code,
            "discount_pct": discount_pct,
            "valid_for_minutes": 15
        }
    }


# ==========================================
# SOVEREIGN GROWTH ENGINE: THE LEARNING LOOP
# ==========================================

from typing import List, Optional

class TelemetryEvent(BaseModel):
    type: str # 'scroll_25', 'time_30s', 'rescue_trigger' vs.
    delta: Optional[int] = None
    ts: int
    threshold: Optional[int] = None
    target: Optional[str] = None

class TelemetryPayload(BaseModel):
    session_id: str
    persona: str
    current_score: int
    url: str
    events: List[TelemetryEvent]

# Memory Buffer (A mock for Redis in Phase 1)
telemetry_vault_buffer = []

from fastapi import Request
import json

@router.post("/telemetry-ingest", status_code=204)
async def ingest_telemetry_beacon(request: Request):
    """
    Receives sendBeacon payloads from SantisTelemetry Frontend V1.
    Push to Redis -> Async Worker -> PostgreSQL for non-blocking 0ms latency.
    Accepts raw body for generic sendBeacon POST compatibility.
    """
    try:
        # 1. Capture raw request body (blob/text string from sendBeacon)
        body_bytes = await request.body()
        if not body_bytes:
            return 
            
        # 2. Parse JSON manually before validation
        payload_dict = json.loads(body_bytes.decode('utf-8'))
        payload = TelemetryPayload(**payload_dict)
        
        # Buffer the events for the Async Worker
        telemetry_vault_buffer.append(payload.dict())
        
        # Log highly critical events directly to HQ
        rescue_events = [e for e in payload.events if e.type == 'rescue_trigger']
        if rescue_events:
            hq_whisper = (
                f"📡 [Telemetry Vault] Rescue Authorized! "
                f"Guest: {payload.session_id[:8]} | Score: {payload.current_score} | Persona: {payload.persona}"
            )
            try:
                await manager.broadcast_to_room({
                    "type": "NEURAL_THOUGHT",
                    "message": hq_whisper,
                    "level": "telemetry",
                    "timestamp": datetime.utcnow().strftime("%H:%M:%S")
                }, "hq_global")
            except Exception:
                pass

        # ==============================================================================
        # PHASE V8: THE SOVEREIGN COMMAND CENTER - CONTINUOUS PULSE
        # Her kalp atışını (Score + Persona güncellemelerini) Dashboard'a fırlat
        # ==============================================================================
        try:
             asyncio.create_task(manager.broadcast_to_room({
                "type": "TELEMETRY_BEACON",
                "session_id": payload.session_id,
                "current_score": payload.current_score,
                "persona": payload.persona,
                "url": payload.url,
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            }, "hq_global"))
        except Exception as e:
            print(f"Watchtower Telemetry Error: {e}")

        return # 204 No Content guarantees lowest latency for sendBeacon
    except Exception as e:
        print(f"Telemetry Ingest Error: {e}")
        return

@router.get("/telemetry-stats")
async def get_sovereign_telemetry_live():
    """
    Feeds the Command Center V1 'Learning Loop' widget.
    Aggregates data from the Redis/Memory Buffer for live pulse.
    """
    # Count Personas in rolling buffer
    recovery = sum(1 for p in telemetry_vault_buffer if p["persona"] == "recovery-seeker")
    sovereign = sum(1 for p in telemetry_vault_buffer if p["persona"] in ["sovereign-guest", "default"])
    explorer = sum(1 for p in telemetry_vault_buffer if p["persona"] == "luxury-explorer")
    
    # Calculate Average Live Score and recent conversions
    total_score = sum(p["current_score"] for p in telemetry_vault_buffer)
    avg_score = int(total_score / max(1, len(telemetry_vault_buffer)))
    
    # If buffer is empty, mock baseline stats to keep the dashboard pulsating nicely
    if len(telemetry_vault_buffer) == 0:
        base = random.randint(30, 60)
        return {
            "ghost_score": base,
            "score_trend": "up" if base > 45 else "down",
            "win_rate": 18.5,
            "conversions": 12,
            "personas": {"recovery": 8, "sovereign": 3, "explorer": 12},
            "sync_status": "AWAITING BEACON"
        }

    return {
        "ghost_score": avg_score,
        "score_trend": "up" if avg_score > 60 else "down", # Dynamic trend
        "win_rate": 22.4, # Mock until conversion link logic is built
        "conversions": 45,
        "personas": {"recovery": recovery, "sovereign": sovereign, "explorer": explorer},
        "sync_status": "BEACON SYNC"
    }

# ==============================================================================
# PROTOCOL 24: THE COGNITIVE NEURAL GATEWAY (BATCH RECEIVER)
# ==============================================================================

class IntentPrediction(BaseModel):
    target_url: str
    confidence: int
    ts: int

class IntentBatchPayload(BaseModel):
    session_id: str
    predictions: List[IntentPrediction]

@router.post("/intent-batch", status_code=204)
async def ingest_intent_batch(payload: IntentBatchPayload):
    """
    Receives batched prediction URLs heavily computed by Web Workers.
    Pushes directly to The War Room WebSocket for Live Rendering.
    """
    for pred in payload.predictions:
        try:
            asyncio.create_task(manager.broadcast_to_room({
                "type": "NEURAL_PREDICTION_PULSE",
                "session_id": payload.session_id,
                "target_url": pred.target_url,
                "confidence": pred.confidence,
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            }, "hq_global"))
        except Exception as e:
            print(f"Watchtower Neural Batch Error: {e}")
    
    return # High performance, fire and forget
