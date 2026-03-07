from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models.tenant import Tenant
from app.db.models.customer import Customer

router = APIRouter()

# Phase 15: Sovereign-Lab V3 Global State
GLOBAL_SURGE_MULTIPLIER = 1.0

@router.get("/admin/surge")
async def get_surge_multiplier():
    return {"surge_multiplier": GLOBAL_SURGE_MULTIPLIER}

@router.post("/admin/surge")
async def update_surge_multiplier(payload: dict = Body(...)):
    global GLOBAL_SURGE_MULTIPLIER
    try:
        GLOBAL_SURGE_MULTIPLIER = float(payload.get("surge_multiplier", 1.0))
    except (ValueError, TypeError):
        GLOBAL_SURGE_MULTIPLIER = 1.0
    return {"status": "success", "surge_multiplier": GLOBAL_SURGE_MULTIPLIER}

from pydantic import BaseModel
class ReservationPayload(BaseModel):
    tenant_id: int
    hotel_id: int
    room_number: str
    service_name: str
    price: float

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

@router.post("/reservation")
async def create_reservation(payload: ReservationPayload, db: AsyncSession = Depends(get_db)):
    # 1. Prototype Mapping: Find first available tenant, customer, service, etc.
    tenant_res = await db.execute(select(Tenant).limit(1))
    t1 = tenant_res.scalar_one_or_none()
    
    cust_res = await db.execute(select(Customer).where(Customer.tenant_id == t1.id).limit(1))
    c1 = cust_res.scalar_one_or_none()
    
    # Check if a custom service exists or create mock
    from app.db.models.service import Service
    from app.db.models.room import Room
    from app.db.models.staff import Staff
    from app.db.models.booking import BookingStatus
    from datetime import datetime
    
    svc_res = await db.execute(select(Service).where(Service.name.ilike(f"%{payload.service_name}%")).limit(1))
    svc = svc_res.scalar_one_or_none()
    
    if not svc:
        svc_res = await db.execute(select(Service).limit(1))
        svc = svc_res.scalar_one_or_none()
        
    room_res = await db.execute(select(Room).limit(1))
    r1 = room_res.scalar_one_or_none()
    
    staff_res = await db.execute(select(Staff).limit(1))
    st1 = staff_res.scalar_one_or_none()
    
    # 2. Insert Booking
    if t1 and c1 and svc:
        new_booking = Booking(
            tenant_id=t1.id,
            customer_id=c1.id,
            service_id=svc.id,
            room_id=r1.id if r1 else None,
            staff_id=st1.id if st1 else None,
            start_time=datetime.utcnow() + timedelta(hours=1),
            end_time=datetime.utcnow() + timedelta(hours=2),
            price_snapshot=payload.price,
            status=BookingStatus.PENDING
        )
        db.add(new_booking)
        
        # 3. Update Daily Revenue for Today
        from app.db.models.revenue import DailyRevenue
        from datetime import date
        today = date.today()
        rev_res = await db.execute(
            select(DailyRevenue)
            .where(DailyRevenue.tenant_id == t1.id, DailyRevenue.date == today)
        )
        dr = rev_res.scalar_one_or_none()
        if dr:
            dr.daily_revenue = float(dr.daily_revenue) + payload.price
            dr.booking_count = dr.booking_count + 1
        else:
            dr = DailyRevenue(tenant_id=t1.id, date=today, daily_revenue=payload.price, booking_count=1)
            db.add(dr)
            
        await db.commit()
    
    # 📌 SANTIS V17 - NEURAL BRIDGE: LIVE FEED STREAM (GUEST_ACTION_SYNC)
    # Trigger HQ Dashboard with the new booking event
    try:
        from datetime import datetime
        # Fetch customer name for the sync payload
        guest_name_sync = "Walk-in Guest"
        if c1:
            guest_name_sync = c1.full_name
        
        live_feed_payload = {
            "type": "GUEST_ACTION_SYNC",
            "action": "New Booking",
            "guest_name": guest_name_sync,
            "room": f"Room {payload.room_number}",
            "hotel": t1.name if t1 else "Unknown Node",
            "service": svc.name if svc else payload.service_name,
            "price": payload.price,
            "tenant_id": payload.tenant_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        from app.core.pulse import pulse_engine
        await pulse_engine.broadcast_to_hq(live_feed_payload)
        print(f"[Neural Bridge] GUEST_ACTION_SYNC dispatched: {guest_name_sync} → {live_feed_payload['service']}")
    except Exception as e:
        print(f"Failed to stream to HQ: {e}")

    return {"status": "success", "message": "Reservation confirmed in Master OS"}


from datetime import timedelta
@router.get("/admin/bookings")
async def get_admin_bookings(db: AsyncSession = Depends(get_db)):
    # Get last 20 bookings globally
    booking_res = await db.execute(
        select(Booking)
        .options(selectinload(Booking.service), selectinload(Booking.room), selectinload(Booking.tenant), selectinload(Booking.customer))
        .order_by(desc(Booking.created_at))
        .limit(20)
    )
    bookings = booking_res.scalars().all()
    
    result = []
    for b in bookings:
        result.append({
            "ref_id": f"BK-{str(b.id)[:8].upper()}",
            "time_ago": b.created_at.strftime("%H:%M") if b.created_at else "Now",
            "tenant_name": b.tenant.name if b.tenant else "Unknown App",
            "guest_info": b.customer.full_name if b.customer else "Walk-in Proxy",
            "service_name": b.service.name if b.service else "Custom",
            "price": float(b.price_snapshot),
            "status": b.status.value
        })
    return {"status": "success", "bookings": result}

from sqlalchemy import select, func, desc
from datetime import date, timedelta
from app.db.models.revenue import DailyRevenue
from app.db.models.booking import Booking

@router.get("/admin/revenue")
async def get_admin_revenue(period: str = "today", db: AsyncSession = Depends(get_db)):
    today = date.today()
    if period == "today":
        start_date = today
    elif period == "week":
        start_date = today - timedelta(days=7)
    elif period == "month":
        start_date = today - timedelta(days=30)
    else:
        start_date = today

    # Aggregate Revenue
    gross_res = await db.execute(
        select(func.sum(DailyRevenue.daily_revenue))
        .where(DailyRevenue.date >= start_date)
    )
    gbv = float(gross_res.scalar() or 0.0)
    net_revenue = gbv * 0.20 # Assume 20% platform cut

    # AOV based on Bookings table for the period
    aov_res = await db.execute(
        select(func.avg(Booking.price_snapshot))
        .where(func.date(Booking.created_at) >= start_date)
    )
    raw_aov = float(aov_res.scalar() or 0.0)
    aov = raw_aov if raw_aov else 126.0

    return {
        "status": "success",
        "data": {
            "gbv": f"€{gbv:,.0f}",
            "net": f"€{net_revenue:,.0f}",
            "aov": f"€{aov:,.0f}",
            "top_service": "Deep Tissue Massage <br/><span class='text-sm text-gray-400 font-normal'>Trending</span>"
        }
    }


async def get_scarcity_bumps(db: AsyncSession) -> dict:
    """
    Phase O helper: returns {service_id: bump} for services with critical stock.
    Called from Phase J auto_pricing_worker every cycle.
    """
    res = await db.execute(text("""
        SELECT service_id, item_name, current_stock, min_threshold, is_luxury
        FROM service_inventory
        WHERE current_stock <= min_threshold
    """))
    rows = res.fetchall()
    bumps = {}
    for service_id, item_name, stock, threshold, is_luxury in rows:
        bump = 0.25 if is_luxury else 0.10
        bumps[service_id] = {"bump": bump, "item": item_name, "stock": stock, "threshold": threshold}
    return bumps


@router.get("/inventory")
async def get_inventory(db: AsyncSession = Depends(get_db)):
    """Phase O – Full inventory list with scarcity status."""
    res = await db.execute(text("""
        SELECT si.id, si.service_id, s.name as service_name,
               si.item_name, si.unit, si.current_stock, si.min_threshold,
               si.is_luxury, si.notes, si.updated_at
        FROM service_inventory si
        LEFT JOIN services s ON s.id = si.service_id
        ORDER BY (si.current_stock - si.min_threshold) ASC
    """))
    rows = res.fetchall()
    items = []
    for r in rows:
        is_critical = r.current_stock <= r.min_threshold
        
        # Phase 15: Scarcity Message Injection
        scarcity_message = None
        if is_critical and r.current_stock > 0:
            scarcity_message = f"Son {int(r.current_stock)} randevu kaldı! (Yüksek Talep)"
        elif r.current_stock <= 0:
            scarcity_message = "Tükendi (Rezervasyon Kapalı)"
            
        items.append({
            "id": r.id, "service_id": r.service_id, "service_name": r.service_name,
            "item_name": r.item_name, "unit": r.unit,
            "current_stock": r.current_stock, "min_threshold": r.min_threshold,
            "is_luxury": bool(r.is_luxury), "notes": r.notes,
            "is_critical": is_critical,
            "scarcity_bump": 0.25 if (is_critical and r.is_luxury) else (0.10 if is_critical else 0.0),
            "scarcity_message": scarcity_message,
            "updated_at": str(r.updated_at)
        })
    return {
        "status": "success", 
        "total": len(items), 
        "critical": sum(1 for i in items if i["is_critical"]), 
        "surge_multiplier": GLOBAL_SURGE_MULTIPLIER,
        "items": items
    }


@router.patch("/inventory/{item_id}")
async def update_inventory_stock(item_id: str, payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """Phase O – Update stock level for an inventory item."""
    res = await db.execute(text("SELECT * FROM service_inventory WHERE id = :id"), {"id": item_id})
    row = res.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    new_stock = payload.get("current_stock", row.current_stock)
    await db.execute(text("""
        UPDATE service_inventory
        SET current_stock = :stock, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    """), {"stock": new_stock, "id": item_id})
    await db.commit()

    is_critical = new_stock <= row.min_threshold
    bump = 0.25 if (is_critical and row.is_luxury) else (0.10 if is_critical else 0.0)

    if is_critical:
        cluster = "Aesthetic Elite" if row.is_luxury else "Recovery Athlete"
        await neural_thought(
            f"Santis Inventory ∷ '{row.item_name}' critical — {new_stock} {row.unit} left. "
            f"Scarcity +{bump:.0%} surge → {cluster} cluster targeted.",
            level="alert" if row.is_luxury else "surge"
        )
    else:
        await neural_thought(f"Santis Inventory ∷ '{row.item_name}' restocked → {new_stock} {row.unit}.", level="info")

    return {
        "status": "success",
        "item_name": row.item_name,
        "new_stock": new_stock,
        "is_critical": is_critical,
        "scarcity_bump": bump
    }

