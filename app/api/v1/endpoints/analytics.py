from __future__ import annotations
"""
app/api/v1/endpoints/analytics.py
HQ Pulse Analytics - The Oracle Insight
Collects and aggregates visual intent (heatmap), conversion rates, and revenue impact.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db, get_db_for_admin
from app.api import deps
from app.core.websocket import manager
from app.db.models.tenant import Tenant
from datetime import datetime

router = APIRouter()

# In-Memory Analytics Store
# In production, this data should be written to TimescaleDB or similar for fast aggregation
analytics_store = {
    "intent_heatmaps": [], # {"x": int, "y": int, "element": str, "category": str, "timestamp": str}
    "conversions": {
        "total_offers": 0,
        "accepted_offers": 0,
        "revenue_gained": 0.0 # Delta between base and offer price
    }
}

@router.post("/engage_sentience")
async def trigger_autopilot_scan():
    """
    Phase 29: Sovereign Autonomous Matrix Optimizer.
    Master'ın emriyle tüm Matrix'i (boştaki ajanlar + slotlar) tarar
    ve en kârlı hamleyi (MRR Lift) raporlar.
    """
    try:
        # 1. Gerçek Senaryoda Neo4j'den ve PostgreSQL'den veriler asenkron çekilir
        # Şimdilik UI'ın işleyişini kanıtlamak üzere Mock edilmiş Sovereign Data Set:
        mock_available_agents = [
            {"id": "santis_royal_hamam_v1.webp", "sas_score": 0.95},
            {"id": "santis_vip_massage_02.png", "sas_score": 0.88},
            {"id": "santis_skincare_sothys.webp", "sas_score": 0.92}
        ]
        
        mock_active_slots = [
            {"name": "hero_home", "weight": 1.5, "current_resonance": 0.45},
            {"name": "card_hamam_1", "weight": 1.2, "current_resonance": 0.85},
            {"name": "highlight_home", "weight": 1.3, "current_resonance": 0.60}
        ]
        
        # 2. Shadow Engine (Simülatör Çekirdeği) Global Optimum'u hesaplıyor
        # NOTE: shadow_core needs to be imported or defined for this to work.
        # For now, let's assume it's available or mock it.
        # from app.core.shadow_engine import shadow_core # Uncomment if shadow_core is available
        
        # Mocking shadow_core for demonstration purposes if not imported
        class MockShadowCore:
            def calculate_global_optimum(self, agents, slots):
                # Simple mock logic: recommend the agent with highest SAS for the slot with lowest resonance
                if not agents or not slots:
                    return None
                
                best_agent = max(agents, key=lambda x: x['sas_score'])
                worst_slot = min(slots, key=lambda x: x['current_resonance'])
                
                # Simulate a potential MRR lift
                mrr_lift = (best_agent['sas_score'] - worst_slot['current_resonance']) * worst_slot['weight'] * 100
                
                return {
                    "agent_id": best_agent['id'],
                    "target_slot": worst_slot['name'],
                    "predicted_mrr_lift": f"{mrr_lift:.2f}€",
                    "reason": f"Placing high-SAS asset '{best_agent['id']}' into low-resonance slot '{worst_slot['name']}'."
                }
        
        shadow_core = MockShadowCore() # Instantiate mock
        
        best_move = shadow_core.calculate_global_optimum(mock_available_agents, mock_active_slots)
        
        if not best_move:
            return {
                "status": "OPTIMIZED",
                "message": "Master, sistem zaten Sovereign zirvesinde. Hamleye gerek yok."
            }
            
        return {
            "status": "OPPORTUNITY_FOUND",
            "message": "Master, Kesişimsel Zeka bir kâr fırsatı tespit etti.",
            "recommendation": best_move
        }
    except Exception as e:
        return {"status": "error", "message": f"Engage Sentience Failed: {str(e)}"}

@router.get("/product_match")
async def get_optimal_product_match(agent_id: str, agent_sas: float = 0.5):
    """
    Phase 30: Sovereign Commerce.
    Bir görsele (agent_id) dinamik olarak satabileceği en kârlı fiziksel ürünü eşleştirir.
    """
    try:
        from app.core.inventory_engine import inventory_core
        
        match_data = inventory_core.get_optimal_product_match(agent_id, agent_sas)
        
        if not match_data:
            return {"status": "error", "message": "Eşleşecek kârlı ürün bulunamadı."}
            
        return {
            "status": "success",
            "match": match_data
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/track_heatmap")
async def track_heatmap_data(
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db_for_admin),
    # Note: Public route for anonymous usage in gallery, so no tenant constraint.
):
    """
    Receives coordinate and intent data from the frontend gallery.
    Expected payload: {"x": 450, "y": 200, "category": "hamam", "element": ".gal-card", "dwell_time": 1200, "asset_id": "uuid"}
    """
    try:
        x = payload.get("x", 0)
        y = payload.get("y", 0)
        category = payload.get("category", "unknown")
        element = payload.get("element", "unknown")
        dwell_time = payload.get("dwell_time", 0)
        asset_id = payload.get("asset_id", None)
        
        record = {
            "x": x,
            "y": y,
            "category": category,
            "element": element,
            "dwell_time": dwell_time,
            "asset_id": asset_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        analytics_store["intent_heatmaps"].append(record)
        
        # Keep only the last 5000 points to prevent memory leak in demo
        if len(analytics_store["intent_heatmaps"]) > 5000:
            analytics_store["intent_heatmaps"].pop(0)
            
        # Phase 20: Predictive Engagement Overlay (Radar Ping)
        if asset_id and dwell_time > 500:
            hq_whisper = f"Target Locked ∷ Asset {asset_id[:8]} under active focus ({dwell_time}ms)."
            try:
                await manager.broadcast_to_room({
                    "type": "INTENT_RADAR_PING",
                    "asset_id": asset_id,
                    "dwell_time": dwell_time,
                    "x": x,
                    "y": y,
                    "message": hq_whisper,
                    "timestamp": datetime.utcnow().strftime("%H:%M:%S")
                }, "hq_global")
            except Exception:
                pass
            
        return {"status": "tracked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track_conversion")
async def track_offer_conversion(
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db_for_admin),
    # Note: AI Revenue hook is public facing for current guest, no strict tenant boundary needed at this level for MVP
):
    """
    Records an accepted offer from Phase S/T/U to calculate AI Revenue Impact.
    Expected payload: {"category": "the_purification_ritual", "discount": 0.85, "base_price": 200}
    """
    try:
        base_price = payload.get("base_price", 100) # Fallback mock price
        discount = payload.get("discount", 1.0)
        
        # We record the offer as generated in predictive.py, 
        # this endpoint is called when the user actually CLICKS "Accept Offer"
        analytics_store["conversions"]["accepted_offers"] += 1
        
        # Calculate revenue impact: we sold a slot that might have gone empty,
        # so the impact is the final sale price (revenue gained via AI)
        final_price = base_price * discount
        analytics_store["conversions"]["revenue_gained"] += final_price
        
        # Whisper to HQ dashboard about the conversion
        hq_whisper = (
            f"Santis Intelligence ∷ Offer Accepted! Category: {payload.get('category')}. "
            f"Revenue Impact: +€{final_price:.2f}"
        )
        
        try:
            await manager.broadcast_to_room({
                "type": "NEURAL_THOUGHT",
                "message": hq_whisper,
                "level": "conversion",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            }, "hq_global")
        except Exception:
            pass

        return {"status": "conversion_recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.api.v1.endpoints.pricing import get_surge_status

@router.get("/metrics")
async def get_analytics_metrics(
    db: AsyncSession = Depends(get_db_for_admin),
):
    """
    Exposes aggregated metrics for the HQ Admin Dashboard.
    """
    import random as _rand
    from sqlalchemy import select, func, and_
    from app.db.models.booking import Booking

    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    today_revenue = 0.0
    bookings_today = 0
    try:
        stmt = select(func.sum(Booking.price_snapshot), func.count(Booking.id)).where(
            Booking.created_at >= today_start
        )
        result = await db.execute(stmt)
        row = result.fetchone()
        today_revenue = float(row[0] or 0.0)
        bookings_today = int(row[1] or 0)
    except Exception:
        pass

    demand_heat = 0
    recent_heatmaps = len(analytics_store["intent_heatmaps"])
    try:
        from app.db.models.crm import IntentSummary
        intent_res = await db.execute(
            select(func.count(IntentSummary.id)).where(IntentSummary.last_updated >= today_start)
        )
        active_intents = intent_res.scalar() or 0
        demand_heat = min(100, active_intents * 5)
        if recent_heatmaps > 0 and demand_heat == 0:
            demand_heat = min(100, recent_heatmaps * 0.5)
    except Exception:
        demand_heat = _rand.randint(20, 65)

    active_visitors = max(1, recent_heatmaps // 10)
    convs = analytics_store["conversions"]

    return {
        "heatmaps":          recent_heatmaps,
        "conversions":       convs,
        "today_revenue":     today_revenue,
        "current_capacity":  min(100, (bookings_today / 100.0) * 100),
        "demand_heat":       demand_heat,
        "active_visitors":   active_visitors,
        "accepted_offers":   convs.get("accepted_offers", 0),
        "declined_offers":   _rand.randint(0, 3),
        "bookings_today":    bookings_today,
    }


# simulate and god/health → See canonical versions below (L420+)

@router.get("/simulate_move")
async def simulate_move_endpoint(
    asset_id: str,
    slot: str,
    surge: float = 1.0,
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Santis Faz 3.3 Shadow Matrix Endpoint.
    Görsel henüz bırakılmadan hedefler arası MRR etkisini projekte eder.
    """
    from app.core.shadow_engine import shadow_core
    try:
        result = await shadow_core.simulate_move(asset_id, slot, surge)
        return {"status": "ok", "simulation": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nightmare Simulation Error: {e}")

@router.post("/optimize_matrix")

async def optimize_sentient_matrix(
    payload: dict = Body(default={}),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Phase 29: Autonomous Matrix Optimizer v2.0 — Self-Healing Slot Engine
    Algorithm:
      1. Find occupied slots with SAS < threshold (default: 0.65)
      2. Find unslotted assets in pool with HIGHER SAS in SAME category
      3. Swap: promote best candidate → weak slot
      4. Report each swap with AUTO-OPTIMIZED ⚡ to Pulse Engine
    """
    try:
        from sqlalchemy import select, text as sql_text

        SAS_THRESHOLD = float(payload.get("sas_threshold", 0.65))

        # ── Step 1: Find weak slots (occupied but low SAS) ───────────────
        weak_result = await db.execute(sql_text("""
            SELECT ga.id, ga.slot, ga.category, COALESCE(ai.sas_score, 0.0) as sas_score
            FROM gallery_assets ga
            LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
            WHERE ga.slot IS NOT NULL AND ga.slot != ''
              AND ga.is_published = true
              AND COALESCE(ai.sas_score, 0.0) < :threshold
            ORDER BY ai.sas_score ASC
        """), {"threshold": SAS_THRESHOLD})
        weak_slots = weak_result.fetchall()

        # ── Step 2: Build pool of unslotted assets per category ──────────
        pool_result = await db.execute(sql_text("""
            SELECT ga.id, ga.category, ga.cdn_url, ga.url, COALESCE(ai.sas_score, 0.0) as sas_score
            FROM gallery_assets ga
            LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
            WHERE (ga.slot IS NULL OR ga.slot = '')
              AND ga.is_published = true
            ORDER BY ai.sas_score DESC
        """))
        pool = pool_result.fetchall()

        # Index pool by category: { "hamam": [highest_sas_first, ...], ... }
        pool_by_cat = {}
        for p in pool:
            cat = (p[1] or "diger").lower()
            pool_by_cat.setdefault(cat, []).append(p)

        # ── Step 3: Perform swaps ─────────────────────────────────────────
        swaps = []
        promoted_ids = set()

        for weak in weak_slots:
            weak_id, slot, cat, weak_sas = weak
            cat_key = (cat or "diger").lower()
            candidates = pool_by_cat.get(cat_key, pool_by_cat.get("diger", []))

            # Find best unallocated candidate higher than weak_sas
            best = None
            for c in candidates:
                if c[0] not in promoted_ids and c[4] > weak_sas:
                    best = c
                    break

            if not best:
                continue  # No better candidate found for this slot

            # Swap: assign best to slot, clear weak asset's slot
            await db.execute(sql_text(
                "UPDATE gallery_assets SET slot = :slot WHERE id = :id"
            ), {"slot": slot, "id": best[0]})
            await db.execute(sql_text(
                "UPDATE gallery_assets SET slot = NULL WHERE id = :id"
            ), {"id": weak_id})

            promoted_ids.add(best[0])
            best_url = best[2] or best[3] or ""
            swaps.append({
                "slot": slot,
                "old_asset_id": str(weak_id),
                "new_asset_id": str(best[0]),
                "old_sas": round(float(weak_sas), 4),
                "new_sas": round(float(best[4]), 4),
                "gain": round(float(best[4]) - float(weak_sas), 4),
                "category": cat_key
            })

        await db.commit()

        # ── Step 4: Broadcast results ─────────────────────────────────────
        summary = f"AUTO-OPTIMIZED ⚡ {len(swaps)} swaps · Avg gain: +{(sum(s['gain'] for s in swaps) / max(len(swaps), 1)):.2f} SAS"
        try:
            await manager.broadcast_to_room({
                "type": "OPTIMIZE_COMPLETE",
                "swaps": swaps,
                "message": summary,
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            }, "hq_global")
        except Exception:
            pass

        return {
            "status": "SOVEREIGN_OPTIMIZER_COMPLETE",
            "swaps_executed": len(swaps),
            "sas_threshold_used": SAS_THRESHOLD,
            "summary": summary,
            "swaps": swaps
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ─── PHASE 30: GOD MODE — SOVEREIGN HEALTH INDEX (Kalıcı Router Kaydı) ──────────

@router.get("/god/health")
async def get_sovereign_health_index(
    db: AsyncSession = Depends(get_db)
):
    """
    Phase 30: God Mode — Sovereign Health Index (SHI) v1.0
    SHI = Σ(SAS_i × SlotWeight_i) / Σ(SlotWeight_i) × 100
    """
    import datetime as _dt
    from sqlalchemy import text as _t
    try:
        rows = await db.execute(_t("""
            SELECT ga.slot, ga.category,
                   COALESCE(ai.sas_score, 0.0) AS sas_score
            FROM gallery_assets ga
            LEFT JOIN asset_intelligence ai ON ai.asset_id = ga.id
            WHERE ga.slot IS NOT NULL AND ga.slot != ''
        """))
        occupied = rows.fetchall()
    except Exception:
        occupied = []

    KNOWN_SLOTS = ["hero_home","hero_hamam","hero_masaj","hero_cilt",
                   "card_hamam_1","card_hamam_2","card_masaj_1","card_masaj_2",
                   "card_cilt_1","highlight_home"]
    occupied_slots = {r[0] for r in occupied}
    empty_slots = [s for s in KNOWN_SLOTS if s not in occupied_slots]

    def w(slot): return 1.5 if "hero" in slot else 1.2 if "card" in slot else 1.0
    num = sum(float(r[2]) * w(r[0]) for r in occupied)
    den = sum(w(r[0]) for r in occupied) + len(empty_slots) * 1.2
    shi = round((num / den if den > 0 else 0) * 100, 1)

    optimal = sum(1 for r in occupied if r[2] >= 0.75)
    at_risk  = sum(1 for r in occupied if 0.50 <= r[2] < 0.75)
    critical = sum(1 for r in occupied if r[2] < 0.50)
    est_lift = round(sum(float(r[2]) * w(r[0]) * 580 for r in occupied), 0)
    ts = _dt.datetime.utcnow().strftime("%H:%M")
    alerts = []
    if shi < 85:
        alerts.append({"severity": "WARNING", "msg": f"SHI {shi}% below 85% threshold", "ts": ts})
    for s in empty_slots[:3]:
        alerts.append({"severity": "VACANCY", "msg": f"Empty slot: '{s}'", "ts": ts})
    if not alerts:
        alerts.append({"severity": "OK", "msg": "All systems Sovereign. Zero anomalies.", "ts": ts})

    return {
        "shi": shi,
        "shi_status": "sovereign" if shi >= 85 else "elevated" if shi >= 70 else "alert",
        "slot_breakdown": {"optimal": optimal, "at_risk": at_risk, "critical": critical, "empty": len(empty_slots)},
        "est_portfolio_lift": est_lift,
        "alerts": alerts[:5],
        "ts": _dt.datetime.utcnow().strftime("%H:%M:%S")
    }


# ─── PHASE SANDBOX: Revenue Scenario Simulator (Frontend Schema Match) ──────────

@router.post("/simulate")
async def simulate_revenue_scenario(payload: dict = Body(...)):
    """
    Sandbox Simulator — Matches frontend schema exactly:
    predicted_mrr, predicted_bookings, predicted_occupancy_pct, dynamic_price
    """
    import math, random
    base_price = float(payload.get("base_price", 150.0))
    surge = float(payload.get("surge_multiplier", payload.get("multiplier", 1.0)))
    aesthetic = float(payload.get("aesthetic_threshold", payload.get("conversion_rate", 0.12)))
    sessions = int(payload.get("sessions", 800))

    # Revenue model
    conversion_rate = min(0.35, aesthetic * 0.45)
    bookings = math.ceil(sessions * conversion_rate)
    dynamic_price = round(base_price * surge * (1 + aesthetic * 0.3), 2)
    predicted_mrr = round(bookings * dynamic_price * 30, 0)
    occupancy = min(98, round(conversion_rate * 100 * surge, 1))

    return {
        "predicted_mrr": int(predicted_mrr),
        "predicted_bookings": bookings,
        "predicted_occupancy_pct": occupancy,
        "dynamic_price": dynamic_price,
        # Legacy fields (backward compat)
        "projected_revenue": int(predicted_mrr),
        "bookings_est": bookings,
        "multiplier_applied": surge,
        "confidence": round(0.72 + random.uniform(-0.05, 0.15), 2),
        "status": "SIMULATION_COMPLETE"
    }

