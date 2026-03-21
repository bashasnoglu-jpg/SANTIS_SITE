import asyncio
import json
import logging
import uuid
import random
import string
from datetime import datetime, timedelta
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.core.websocket import manager as ws_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NeuralWorker")

async def process_pending_events():
    """Fetches PENDING events from outbox_events and processes INTENT rules."""
    async with AsyncSessionLocal() as db:
        # Fetch up to 50 pending items
        res = await db.execute(text(
            "SELECT id, event_type, payload FROM outbox_events WHERE status = 'PENDING' LIMIT 50"
        ))
        rows = res.fetchall()
        
        if not rows:
            return

        # Prepare to mark as processed
        processed_ids = []

        # We will collect intent actions by session_id to detect whales/persistent guests
        for row in rows:
            event_id, event_type, payload_str = row[0], row[1], row[2]
            processed_ids.append(event_id)
            
            if event_type.startswith("visitor."):
                action_type = event_type.split(".", 1)[1]
                try:
                    payload = json.loads(payload_str)
                except Exception:
                    continue

                trace_id = payload.get("trace_id")
                target = payload.get("target")
                intent_delta = payload.get("intent_delta", 0)

                # Look up the session_id from crm_guest_traces
                trace_res = await db.execute(text("SELECT session_id FROM crm_guest_traces WHERE id = :tid"), {"tid": trace_id})
                trace_row = trace_res.fetchone()
                if trace_row:
                    session_id = trace_row[0]
                    # Check how many times this session has interacted with this target
                    count_res = await db.execute(text(
                        "SELECT COUNT(*) FROM crm_guest_traces WHERE session_id = :sid AND target_element = :tgt"
                    ), {"sid": session_id, "tgt": target})
                    
                    interaction_count = count_res.scalar() or 0

                    if interaction_count >= 1: # MVP Test: Gemi Kaptanı testi için tetikleyici 1'e düşürüldü.
                        logger.info(f"[Neural Worker] Sovereign Target Alert! Session {session_id} viewed {target} {interaction_count} times.")
                        
                        # Check if a promo token already generated recently
                        promo_res = await db.execute(text(
                            "SELECT COUNT(*) FROM promo_tokens WHERE session_id = :sid AND action = :tgt"
                        ), {"sid": session_id, "tgt": target})
                        
                        if (promo_res.scalar() or 0) == 0:
                            # Generate a specialized 10% discount token
                            token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
                            expires_at = (datetime.now() + timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M:%S')
                            
                            await db.execute(text("""
                                INSERT INTO promo_tokens (id, session_id, discount_pct, action, expires_at, used)
                                VALUES (:tid, :sid, :disc, :action, :exp, 0)
                            """), {
                                "tid": token,
                                "sid": session_id,
                                "disc": 10.0,
                                "action": target,
                                "exp": expires_at
                            })
                            
                            # Broadcast Sovereign Aura directly to the Edge Node / Ghost Persona
                            room_id = f"site_{session_id}"
                            await ws_manager.broadcast_to_room({
                                "type": "SOVEREIGN_AURA",
                                "target": target,
                                "token": token,
                                "discount_pct": 10.0,
                                "message": f"Bu deneyimin sizin için tasarlandığını biliyoruz. Size özel %10 Ayrıcalık Kodu: NV-{token}"
                            }, room_id)
                            
                            logger.info(f"[Neural Worker] ⚡ Sovereign Aura injected directly into {room_id}")

        if processed_ids:
            # Mark all as PROCESSED
            placeholders = ",".join([f"'{eid}'" for eid in processed_ids])
            await db.execute(text(f"UPDATE outbox_events SET status = 'PROCESSED' WHERE id IN ({placeholders})"))
            await db.commit()

async def neural_worker_loop():
    logger.info("🧠 [Neural Hub] V1 Core Online. Autonomous Event Processing started.")
    tick = 0
    while True:
        try:
            await process_pending_events()
            
            # PHASE 45 H2: A/B Winner Evaluation (Her 30 turda bir = ~60 saniye)
            tick += 1
            if tick % 30 == 0:
                await evaluate_ab_winners()
                
        except Exception as e:
            logger.error(f"[Neural Hub] Exception in loop: {e}")
        await asyncio.sleep(2)


async def evaluate_ab_winners():
    """
    Phase 45 H2: Neural Darwinism - A/B Winner Seçim Algoritması
    1000+ impression'a ulaşan slot'larda en yüksek CTR'lı asset'i Sovereign Winner ilan eder.
    """
    try:
        async with AsyncSessionLocal() as db:
            # A/B impression verisi olan slot'ları bul (gallery_assets tablosunda)
            res = await db.execute(text("""
                SELECT slot_key, asset_id, impression_count, click_count
                FROM gallery_assets
                WHERE impression_count >= 1000 AND is_winner = 0
                ORDER BY slot_key, (CAST(click_count AS FLOAT) / impression_count) DESC
            """))
            rows = res.fetchall()
            
            if not rows:
                return
            
            # Slot'a göre grupla, en yüksek CTR'lı olanı winner yap
            slots_seen = set()
            winners = []
            for row in rows:
                slot_key, asset_id, impressions, clicks = row
                if slot_key not in slots_seen:
                    slots_seen.add(slot_key)
                    ctr = (clicks / impressions * 100) if impressions > 0 else 0
                    winners.append((slot_key, asset_id, ctr))
                    logger.info(f"[Neural Worker] ⚡ Sovereign Winner: slot={slot_key} asset={asset_id} CTR={ctr:.2f}%")
            
            # Winner'ları işaretle, aynı slottaki diğerlerini sıfırla
            for slot_key, winner_asset_id, ctr in winners:
                await db.execute(text(
                    "UPDATE gallery_assets SET is_winner = 0 WHERE slot_key = :slot"
                ), {"slot": slot_key})
                await db.execute(text(
                    "UPDATE gallery_assets SET is_winner = 1 WHERE asset_id = :aid"
                ), {"aid": winner_asset_id})
                logger.info(f"[Neural Darwinism] 🏆 Winner locked: {winner_asset_id} for slot '{slot_key}'")
            
            if winners:
                await db.commit()
                
    except Exception as e:
        # Tablo yoksa veya sütun eksikse sessizce geç (MVP güvenliği)
        logger.debug(f"[AB Winner] Evaluation skipped: {e}")

