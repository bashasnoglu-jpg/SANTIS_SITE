"""
app/core/yield_engine.py
Phase J: Dynamic Yield Management (Surge Engine)
Calculates real-time demand multipliers based on capacity and intent.
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.db.models.booking import Booking
from app.db.models.service import Service
from app.core import websocket

async def get_tenant_occupancy(db: AsyncSession, tenant_id: str) -> float:
    """
    Calculates current occupancy for a tenant today using raw SQL.
    """
    from sqlalchemy import text
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')

    try:
        result = await db.execute(text(
            "SELECT COUNT(*) FROM bookings "
            "WHERE start_time >= :ts AND tenant_id = :tid AND status IN ('CONFIRMED','COMPLETED')"
        ), {"ts": today_start, "tid": str(tenant_id)})
        booking_count = result.scalar() or 0
    except Exception:
        booking_count = 0

    TOTAL_DAILY_CAPACITY = 50
    return min(booking_count / TOTAL_DAILY_CAPACITY, 1.0)


async def get_service_intent_score(db: AsyncSession, service_id: str) -> int:
    """
    Phase 9.1: Real intent scoring from Ghost Tracker traces.
    """
    from sqlalchemy import text
    try:
        result = await db.execute(text(
            "SELECT COUNT(*) FROM crm_guest_traces "
            "WHERE created_at > datetime('now', '-1 hour')"
        ))
        score = result.scalar() or 0
        return min(score, 100)
    except Exception:
        return 0


async def calculate_surge_price(db: AsyncSession, service_id: str, tenant_id: str):
    """
    The Core Yield Algorithm.
    """
    from sqlalchemy import text

    occupancy = await get_tenant_occupancy(db, tenant_id)
    intent_score = await get_service_intent_score(db, service_id)

    multiplier = 1.0
    if occupancy > 0.8:
        multiplier += 0.3
    if intent_score > 50:
        multiplier += 0.2
    multiplier = min(multiplier, 2.0)

    # Fetch service via raw SQL to avoid UUID type issues
    try:
        r = await db.execute(text(
            "SELECT id, name, price, min_price_eur, max_price_eur, current_price_eur FROM services WHERE id = :sid"
        ), {"sid": str(service_id)})
        row = r.fetchone()
    except Exception:
        return None

    if not row:
        return None
        
    # row: (id, name, price, min_price_eur, max_price_eur, current_price_eur)
    svc_id_str   = str(row[0])
    svc_name     = row[1]
    base_price   = float(row[2]) if row[2] else 0.0
    min_price    = float(row[3]) if row[3] else None
    max_price    = float(row[4]) if row[4] else None
    cur_price    = float(row[5]) if row[5] else None

    new_price = round(base_price * multiplier, 2)
    if min_price and new_price < min_price:
        new_price = min_price
    if max_price and new_price > max_price:
        new_price = max_price

    actual_multiplier = new_price / base_price if base_price > 0 else 1.0
    surge_occurred = actual_multiplier > 1.0 and (cur_price is None or cur_price < new_price)

    # Persist via raw SQL UPDATE
    try:
        await db.execute(text(
            "UPDATE services SET current_price_eur=:p, demand_multiplier=:m WHERE id=:sid"
        ), {"p": new_price, "m": actual_multiplier, "sid": svc_id_str})
        await db.commit()
    except Exception:
        pass

    if surge_occurred:
        intensity = "CRITICAL" if actual_multiplier > 1.3 else "HIGH"
        try:
            await websocket.manager.broadcast_to_room({
                "type": "PRICE_SURGE",
                "message": f"Algorithmic Surge: {svc_name} [{intensity}] -> €{new_price}",
                "service_id": svc_id_str,
                "new_price": new_price,
                "multiplier": actual_multiplier
            }, "hq_global")
        except Exception:
            pass

    return {
        "service_id": svc_id_str,
        "base_price": base_price,
        "current_price": new_price,
        "multiplier": actual_multiplier,
        "occupancy": occupancy,
        "intent_score": intent_score
    }

