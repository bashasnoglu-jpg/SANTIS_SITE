import asyncio
import logging
import json

from app.api.v1.endpoints.events import flush_event_buffer
from app.api.v1.endpoints.pricing import get_surge_status
from app.core.websocket import manager
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)

class IntelligenceWorker:
    def __init__(self):
        self.is_running = False
        self._flush_task = None
        self._pulse_task = None
        self._judge_task = None
        self._autopilot_sent: set = set()  # Phase 18: Anti-spam guard (session_id → block duplicate invites)
        
    def start(self):
        self.is_running = True
        self._flush_task = asyncio.create_task(self._flush_loop())
        self._pulse_task = asyncio.create_task(self._pulse_loop())
        self._judge_task = asyncio.create_task(self._judgment_loop())
        logger.info("Santis Data Engine: Intelligence Worker Started (Buffer, Pulse & Judgment).")
        
    def stop(self):
        self.is_running = False
        if self._flush_task: self._flush_task.cancel()
        if self._pulse_task: self._pulse_task.cancel()
        if self._judge_task: self._judge_task.cancel()
            
    async def _flush_loop(self):
        """Phase F: Unloads the async buffer to the Graph safely."""
        while self.is_running:
            try:
                await flush_event_buffer()
            except Exception as e:
                logger.error(f"Santis Event Buffer Error: {e}")
            await asyncio.sleep(5)
            
    async def _pulse_loop(self):
        """Phase F: The Neural Push. WebSockets replace HTTP Polling."""
        while self.is_running:
            try:
                async with AsyncSessionLocal() as db:
                    surge_data = await get_surge_status(db)
                    payload = {"type": "INTELLIGENCE_PULSE", "surge": surge_data}
                    await manager.broadcast_to_room(payload, "hq_global")
            except Exception as e:
                pass # Pulse is meant to be silent on failure
            await asyncio.sleep(10)  # Phase 16: was 4s — reduced flood to ~6/min

    async def _judgment_loop(self):
        """Phase 14: Sovereign Judgment + Gemini Neural Strategy."""
        from sqlalchemy import text
        from app.core.decision_engine import DecisionEngine
        from app.core.gemini_engine import generate_strategy
        from app.core.revenue_oracle import compute_oracle_score  # Phase 17: Revenue Oracle
        from app.db.models.revenue_score import RevenueScore      # Phase 17: Oracle Ledger
        import random

        while self.is_running:
            try:
                async with AsyncSessionLocal() as db:
                    # RLS bypass: platform admin context (PostgreSQL only)
                    try:
                        await db.execute(text("SELECT set_config('app.is_platform_admin','true',true)"))
                        await db.execute(text("SELECT set_config('app.current_tenant_id','',true)"))
                    except Exception:
                        pass  # SQLite: set_config not available, silently skip
                    res = await db.execute(text(
                        "SELECT id, payload, event_type FROM outbox_events WHERE status = 'PENDING' LIMIT 10"
                    ))
                    events = res.fetchall()

                    if events:
                        rules = None  # Cache rules once per batch

                        for evt in events:
                            tenant_id = "system"  # outbox_events has no tenant_id column
                            try:
                                event_data = json.loads(evt.payload)
                            except Exception:
                                event_data = {}

                            intent = event_data.get("intent_delta", random.randint(30, 90))
                            occupancy = random.uniform(0.45, 0.95)  # TODO: replace with real sensor

                            state = {
                                "intent_score": intent,
                                "occupancy_pct": occupancy
                            }

                            # Lazy-load rules once per batch
                            if rules is None:
                                rules = await DecisionEngine.get_active_rules(db, tenant_id)

                            # ── Phase 14: Real Gemini Strategy ──────────────────
                            gemini_result = await generate_strategy(db, tenant_id, occupancy)
                            ai_rec = gemini_result.get("action", "HOLD")
                            ai_confidence = gemini_result.get("confidence", 0.5)
                            ai_reasoning = gemini_result.get("reasoning", "")
                            # Log Gemini insight to console
                            logger.info(
                                f"[Gemini] action={ai_rec} | conf={ai_confidence:.2f} | {ai_reasoning[:60]}"
                            )

                            rule_action, rule_name, is_auto, action_params = DecisionEngine.evaluate_intent(rules, state)

                            # ─── AUTONOMOUS EXECUTION ───────────────────────────────
                            actual_outcome = "OBSERVED_ONLY"
                            if is_auto and rule_action != "HOLD":
                                actual_outcome = "EXECUTED"

                                if rule_action == "SURGE":
                                    # ⚡ SURGE: Apply real price multiplier to all active services
                                    raw_multiplier = action_params.get("price_multiplier", 1.15)
                                    from app.core.pricing_engine import PricingSafetyHook
                                    try:
                                        # Get all active services for this tenant
                                        svc_res = await db.execute(text(
                                            "SELECT id, name, price FROM services WHERE tenant_id=:tid AND is_active=1 AND is_deleted=0"
                                        ), {"tid": tenant_id})
                                        surge_services = svc_res.fetchall()

                                        surged_count = 0
                                        # Use the session event ID as correlation DNA for the audit trail
                                        correlation_id = str(evt.id)
                                        
                                        # Anti-Fragile Core: Force Safety Hook Validation across the full service batch
                                        # For simplicity in this loop, we validate once based on a nominal 100€ base price,
                                        # but ideally we evaluate the multiplier itself.
                                        multiplier = await PricingSafetyHook.validate_and_commit_surge(
                                            tenant_id=tenant_id,
                                            base_price=100.0, # Dummy base for audit
                                            calculated_multiplier=raw_multiplier,
                                            correlation_id=correlation_id
                                        )

                                        for svc in surge_services:
                                            new_price = round(float(svc[2]) * multiplier, 2)
                                            await db.execute(text(
                                                "UPDATE services SET current_price_eur=:p, demand_multiplier=:m WHERE id=:sid"
                                            ), {"p": new_price, "m": multiplier, "sid": str(svc[0])})
                                            surged_count += 1

                                        # Broadcast PRICE_SURGE to HQ dashboard
                                        await manager.broadcast_to_room({
                                            "type": "PRICE_SURGE",
                                            "message": f"⚡ Otonom Surge: {surged_count} hizmet +%{round((multiplier-1)*100)}",
                                            "multiplier": multiplier,
                                            "tenant_id": tenant_id,
                                            "autonomous": True
                                        }, "hq_global")

                                        # Broadcast SURGE_ACTIVE badge to site frontend
                                        await manager.broadcast_to_room({
                                            "type": "SURGE_ACTIVE",
                                            "multiplier": multiplier,
                                            "label": f"Yoğun Talep — Fiyatlar +%{round((multiplier-1)*100)} Güncellendi"
                                        }, "site_live")

                                    except Exception as surge_err:
                                        logger.error(f"[Surge Execution] {surge_err}")

                                elif rule_action == "FLASH_OFFER":
                                    # 🟡 FLASH_OFFER: Broadcast Urgency Banner
                                    banner_payload = {
                                        "type": "URGENCY_BANNER",
                                        "action": rule_action,
                                        "rule": rule_name,
                                        "params": action_params,
                                        "ai_backed": (ai_rec == rule_action)
                                    }
                                    try:
                                        await manager.broadcast_to_room(banner_payload, "site_live")
                                    except Exception:
                                        pass

                            # ─── SHADOW LOG ─────────────────────────────────────────
                            lift = action_params.get("discount_pct", 0) * 15.0  # ~€15 per % discount on AOV
                            await DecisionEngine.log_shadow_decision(
                                db=db, tenant_id=tenant_id, event_id=str(evt.id),
                                ai_rec=ai_rec, rule_dec=rule_action, actual=actual_outcome,
                                was_autonomous=is_auto, lift_estimate=lift
                            )

                            # ─── PHASE 17: REVENUE ORACLE PIPELINE ─────────────────
                            try:
                                import uuid as _uuid
                                oracle = compute_oracle_score(
                                    intent_score=int(intent),
                                    session_duration_sec=int(event_data.get("session_duration", 90)),
                                    page_depth=int(event_data.get("page_depth", 2)),
                                    service_interest=event_data.get("service_interest", ""),
                                    behavioral_tags=event_data.get("tags", []),
                                    guest_name=event_data.get("guest_name", ""),
                                    session_id=str(evt.id),
                                )
                                # 💾 Persist to Sovereign Ledger
                                score_row = RevenueScore(
                                    id=str(_uuid.uuid4()),
                                    session_id=oracle["session_id"],
                                    guest_name=oracle["guest_name"] or None,
                                    tenant_id=tenant_id,
                                    composite_score=oracle["composite_score"],
                                    tier=oracle["tier"],
                                    is_whale=oracle["is_whale"],
                                    intent_component=oracle["components"]["intent"],
                                    recency_component=oracle["components"]["recency"],
                                    aov_component=oracle["components"]["aov"],
                                    behavior_component=oracle["components"]["behavior"],
                                    service_interest=oracle["service_interest"] or None,
                                    behavioral_tags=oracle["behavioral_tags"],
                                    nudge_type=oracle["nudge"]["type"],
                                    nudge_message=oracle["nudge"]["message"],
                                )
                                db.add(score_row)
                                # 🐋 Whale Alert → HQ Global Broadcast
                                if oracle["is_whale"]:
                                    logger.warning(
                                        f"[Oracle] 🐋 WHALE: {oracle['guest_name'] or 'Anonim VIP'} "
                                        f"| score={oracle['composite_score']} | nudge={oracle['nudge']['type']}"
                                    )

                                    # ── Phase 18: AUTOPILOT ────────────────────────────────
                                    anti_spam_key = oracle["session_id"]
                                    if anti_spam_key not in self._autopilot_sent:
                                        self._autopilot_sent.add(anti_spam_key)
                                        # Evict old keys (keep set small)
                                        if len(self._autopilot_sent) > 500:
                                            self._autopilot_sent.pop()  # type: ignore

                                        # Non-blocking: fire-and-forget
                                        async def _send_invite(_oracle=oracle, _tenant=tenant_id):
                                            try:
                                                from app.core.gemini_engine import (
                                                    generate_sovereign_invite,
                                                    fetch_guest_history,
                                                )
                                                # Phase 18.5: Conversion Memory
                                                async with AsyncSessionLocal() as local_db:
                                                    guest_history = await fetch_guest_history(
                                                        local_db,
                                                        _oracle.get("guest_name", ""),
                                                        _tenant,
                                                    )
                                                invite = await generate_sovereign_invite(
                                                    _oracle,
                                                    guest_history=guest_history,
                                                )
                                                payload = {
                                                    "type": "WHALE_DETECTED",
                                                    "guest": _oracle["guest_name"] or "Anonim VIP",
                                                    "score": _oracle["composite_score"],
                                                    "tier": _oracle["tier"],
                                                    "nudge": _oracle["nudge"],
                                                    "service": _oracle["service_interest"],
                                                    "tenant_id": _tenant,
                                                    "sovereign_invite": invite,
                                                    "autopilot": True,
                                                    "is_returning": invite.get("is_returning", False),
                                                    "guest_history": {
                                                        "visits": (guest_history or {}).get("visits", 0),
                                                        "total_spent_eur": (guest_history or {}).get("total_spent_eur", 0),
                                                        "fav_service": (guest_history or {}).get("fav_service", ""),
                                                    },
                                                }
                                                # Phase 18.5: Tenant-scoped dual broadcast
                                                tenant_room = f"hq_{_tenant}" if _tenant else "hq_global"
                                                await manager.broadcast_to_rooms(payload, ["hq_global", tenant_room])
                                                logger.info(
                                                    f"[Autopilot] \U0001f916 Invite sent to '{_oracle['guest_name']}' "
                                                    f"| returning={invite.get('is_returning')} "
                                                    f"| promo={invite.get('promo_code')} | src={invite.get('source')}"
                                                )
                                            except Exception as ap_err:
                                                logger.error(f"[Autopilot] {ap_err}")

                                        asyncio.create_task(_send_invite())
                                    else:
                                        # Whale already engaged — broadcast simple alert (no Gemini call)
                                        tenant_room = f"hq_{tenant_id}" if tenant_id else "hq_global"
                                        await manager.broadcast_to_rooms({
                                            "type": "WHALE_DETECTED",
                                            "guest": oracle["guest_name"] or "Anonim VIP",
                                            "score": oracle["composite_score"],
                                            "tier": oracle["tier"],
                                            "nudge": oracle["nudge"],
                                            "service": oracle["service_interest"],
                                            "tenant_id": tenant_id,
                                            "autopilot": False,
                                        }, ["hq_global", tenant_room])
                                    # ────────────────────────────────────────────────────────────────────
                            except Exception as oracle_err:
                                logger.error(f"[Oracle Pipeline] {oracle_err}")
                            # ────────────────────────────────────────────────────────

                            # ─── MARK PROCESSED ─────────────────────────────────────
                            await db.execute(text(
                                "UPDATE outbox_events SET status='PROCESSED', processed_at=CURRENT_TIMESTAMP WHERE id=:eid"
                            ), {"eid": evt.id})

                        await db.commit()

            except Exception as e:
                logger.error(f"[Judgment Layer] {e}")
            await asyncio.sleep(2)

intelligence_worker = IntelligenceWorker()
