import ast
import re

# 1. Clean server.py
with open('server.py', 'r', encoding='utf-8') as f:
    source_server = f.read()

tree_server = ast.parse(source_server)
funcs_server = {
    'create_reservation',
    'get_admin_bookings',
}

lines_server = source_server.splitlines(True)
lines_to_keep_server = [True] * len(lines_server)

for node in tree_server.body:
    if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)) and node.name in funcs_server:
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep_server[i] = False
    if isinstance(node, ast.ClassDef) and node.name == 'ReservationPayload':
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep_server[i] = False

new_source_server = ''.join([line for i, line in enumerate(lines_server) if lines_to_keep_server[i]])

# Inject router
router_block = """app.include_router(
    bookings.router,
    prefix="/api/v1/bookings",
)
app.include_router(
    bookings.legacy_router,
    prefix="/api/v1",
    tags=["bookings_legacy"]
)"""

new_source_server = re.sub(
    r'app\.include_router\(\s*bookings\.router,\s*prefix="/api/v1/bookings"(,\s*tags=\["bookings"\],*)?\s*\)',
    router_block,
    new_source_server,
    count=1
)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(new_source_server)

# 2. Append to bookings.py
legacy_code = """

# --- LEGACY NEURAL BRIDGE ENDPOINTS TRANSFERRED FROM SERVER.PY ---
legacy_router = APIRouter()

class ReservationPayload(BaseModel):
    tenant_id: int
    hotel_id: int
    room_number: str
    service_name: str
    price: float

@legacy_router.post("/reservation")
async def create_reservation(payload: ReservationPayload, db: AsyncSession = Depends(get_db)):
    # 1. Prototype Mapping: Find first available tenant, customer, service, etc.
    tenant_res = await db.execute(select(Tenant).limit(1))
    t1 = tenant_res.scalar_one_or_none()
    
    cust_res = await db.execute(select(Customer).where(Customer.tenant_id == t1.id).limit(1))
    c1 = cust_res.scalar_one_or_none()
    
    from app.db.models.room import Room
    from app.db.models.staff import Staff
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
    
    try:
        from datetime import datetime
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
        from app.core.websocket import manager
        await manager.broadcast_global(live_feed_payload)
        print(f"[Neural Bridge] GUEST_ACTION_SYNC dispatched: {guest_name_sync} → {live_feed_payload['service']}")
    except Exception as e:
        print(f"Failed to stream to HQ: {e}")

    return {"status": "success", "message": "Reservation confirmed in Master OS"}


@legacy_router.get("/admin/bookings")
async def get_admin_bookings(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
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
            "price": float(b.price_snapshot) if b.price_snapshot else 0.0,
            "status": getattr(b.status, 'value', b.status) if hasattr(b.status, 'value') else "PENDING"
        })
    return {"status": "success", "bookings": result}
"""

with open('app/api/v1/endpoints/bookings.py', 'a', encoding='utf-8') as f:
    f.write(legacy_code)

print('Successfully extracted booking logic and appended to bookings.py.')
