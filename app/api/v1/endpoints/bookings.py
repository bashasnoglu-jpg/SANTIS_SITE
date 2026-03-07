from __future__ import annotations
from typing import Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from decimal import Decimal

from app.api import deps
from app.schemas import booking as schemas
from app.db.session import get_db, get_db_for_admin
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service
from app.db.models.customer import Customer
from app.db.models.precomputed_slot import PrecomputedSlot, SlotStatus
from app.db.models.tenant import Tenant
from app.core.logic.booking import check_availability
from app.core.logic.revenue import calculate_commission
from app.core.permissions import Permission
from app.db.models.content import ContentEdge
import uuid
from app.core.currency import apply_currency_vault_snapshot
from app.services.event_bus import EventBus

router = APIRouter()

@router.post("/services", response_model=schemas.ServiceOut)
async def create_service(
    service_in: schemas.ServiceCreate,
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
    current_tenant: Tenant = Depends(deps.get_current_tenant),
) -> Any:
    service = Service(
        tenant_id=current_tenant.id,
        name=service_in.name,
        duration_minutes=service_in.duration_minutes,
        price=service_in.price,
        currency=service_in.currency
    )
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service

@router.post("/staff", response_model=schemas.StaffOut)
async def create_staff(
    staff_in: schemas.StaffCreate,
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
    current_tenant: Tenant = Depends(deps.get_current_tenant),
) -> Any:
    staff = Staff(
        tenant_id=current_tenant.id,
        name=staff_in.name,
        role=staff_in.role,
        commission_rate=staff_in.commission_rate
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff


from app.core.logic.revenue import calculate_commission, update_revenue_analytics
from app.db.models.commission import StaffCommission, CommissionType # for rule creation
from app.schemas import commission as commission_schemas
from sqlalchemy import select 

from decimal import Decimal

@router.post("/commission-rules", response_model=commission_schemas.CommissionRuleOut)
async def create_commission_rule(
    rule_in: commission_schemas.CommissionRuleCreate,
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
) -> Any:
    rule = StaffCommission(
        tenant_id=current_user.tenant_id,
        staff_id=rule_in.staff_id,
        service_id=rule_in.service_id,
        type=rule_in.type,
        value=rule_in.value
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule

from pydantic import BaseModel

import uuid

class WalkInRequest(BaseModel):
    tenant_id: str
    hotel_id: str
    room_number: str
    service_name: str
    price: float

@router.post("/walk-in", response_model=Any)
async def create_walk_in(
    req: WalkInRequest,
    db: AsyncSession = Depends(get_db_for_admin)
) -> Any:
    """
    Dedicated endpoint for fast walk-in checkouts from the Tenant Dashboard.
    It expects service name strings instead of UUIDs.
    """
    # 0. Handle Mock/Legacy tenant_id "1" from demo UI
    if req.tenant_id == "1":
        tenant_res = await db.execute(select(Tenant).limit(1))
        tenant = tenant_res.scalars().first()
        if not tenant:
            raise HTTPException(status_code=404, detail="No tenants found")
        actual_tenant_id = tenant.id
    else:
        actual_tenant_id = uuid.UUID(req.tenant_id)

    # Find the service by name (or grab the first one if we want to be overly permissive for demo)
    result = await db.execute(select(Service).where(Service.name.ilike(f"%{req.service_name}%")))
    service = result.scalars().first()
    
    # Fallback if service not found by exact string, get any service
    if not service:
        service_fallback = await db.execute(select(Service))
        service = service_fallback.scalars().first()
        if not service:
            raise HTTPException(status_code=404, detail="No services defined in DB")

    # Use the existing datetime from the top of the file
    from datetime import timezone
    now = datetime.now(timezone.utc)
    
    # Use generic Guest for walk-in if Customer doesn't exist
    from app.db.models.customer import Customer
    cust_res = await db.execute(select(Customer).where(Customer.phone == "WALKIN"))
    customer = cust_res.scalars().first()
    if not customer:
        customer = Customer(
            tenant_id=actual_tenant_id,
            full_name="Walk-In Guest",
            phone="WALKIN",
            email=f"walkin_{now.timestamp()}@santis.local"
        )
        db.add(customer)
        await db.commit()
        await db.refresh(customer)

    # V11: The Currency Vault
    vault_data = await apply_currency_vault_snapshot(db, local_amount=req.price, local_currency="EUR", base_currency="EUR")

    booking = Booking(
        tenant_id=actual_tenant_id,
        customer_id=customer.id,
        service_id=service.id,
        start_time=now,
        end_time=now + timedelta(minutes=service.duration_minutes),
        status="CONFIRMED",
        price_snapshot=req.price,
        currency_snapshot="EUR",
        fx_rate_snapshot=vault_data["fx_rate_snapshot"],
        local_currency=vault_data["local_currency"],
        base_currency_amount=vault_data["base_currency_amount"]
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # 3. Handle Revenue Analytics
    await update_revenue_analytics(db, actual_tenant_id, float(booking.price_snapshot), booking_date=now.date())
    
    # Phase D: Create AI Semantic Graph Edge
    edge = ContentEdge(
        source_id=str(customer.id),
        source_type="guest",
        edge_type="purchased",
        target_id=str(service.id),
        target_type="service",
        metadata_json={"source": "walk_in", "revenue": float(booking.price_snapshot)}
    )
    db.add(edge)
    await db.commit()
    
    # 4. Neural Bridge Matrix HQ Live Sync (Phase 3)
    from app.core.websocket import manager
    import asyncio
    
    sync_payload = {
        "type": "GUEST_ACTION_SYNC",
        "action": "New Ritual Booking",
        "guest_name": customer.full_name,
        "room": req.room_number,
        "service": service.name,
        "price": float(booking.price_snapshot),
        "timestamp": now.isoformat()
    }
    
    # Fire and Forget Broadcast to HQ Global Room
    asyncio.create_task(manager.broadcast_to_room(sync_payload, "hq_global"))
    
    # Phase V12: Sovereign Event Bus Injection
    EventBus.emit(
        event_name="booking_created",
        payload={
            "revenue_eur": float(vault_data["base_currency_amount"]),
            "service_name": service.name,
            "guest_type": "walk_in",
            "room_number": req.room_number,
            "city": tenant.city if 'tenant' in locals() and hasattr(tenant, 'city') else "Unknown" # Ideally from Tenant object
        },
        tenant_id=str(actual_tenant_id),
        user_id=str(customer.id)
    )

    return {"status": "success", "booking_id": booking.id, "message": "Walk-in processed successfully"}


@router.post("/", response_model=schemas.BookingOut)
async def create_booking(
    booking_in: schemas.BookingCreate,
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.get_current_user), 
    current_tenant: Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Create a new booking with strict overlap checking + Revenue/CRM Logic.
    """
    tenant_id = current_tenant.id

    # 1. Get Service details
    service = await db.get(Service, booking_in.service_id)
    if not service or service.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")

    # 2. Calculate End Time
    end_time = booking_in.start_time + timedelta(minutes=service.duration_minutes)

    # 3. Availability Check via Precomputed Slots (Pessimistic Locking)
    # We look for a slot that covers this request and is AVAILABLE or an expired HELD slot
    now = datetime.utcnow()
    stmt = select(PrecomputedSlot).where(
        PrecomputedSlot.tenant_id == tenant_id,
        PrecomputedSlot.service_id == service.id,
        PrecomputedSlot.start_time == booking_in.start_time,
        # Slot must be AVAILABLE or a HELD slot that timed out
        and_(
            PrecomputedSlot.status.in_([SlotStatus.AVAILABLE, SlotStatus.HELD]),
            func.coalesce(PrecomputedSlot.held_until, now) <= now 
            # If held_until is null (Available), coalesce returns 'now', which is <= 'now' (True)
            # If HELD, it checks if held_until <= now (Expired)
        )
    ).with_for_update() # The Conflict Killer

    result = await db.execute(stmt)
    slot = result.scalars().first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot is currently unavailable, locked by another customer, or does not exist."
        )
        
    # Phase 8: The Redis Fortress (Redlock Race Condition Shield)
    from app.core.redis import acquire_lock
    
    async with acquire_lock(f"slot_{slot.id}", timeout_seconds=8) as locked:
        if not locked:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot is currently being viewed by another high-intent guest. Please try again."
            )
            
        # Lock the slot for 5 minutes (Payment Window) - Phase 4 Logic
        slot.status = SlotStatus.HELD
        slot.held_until = now + timedelta(minutes=5)
        
        # Flush here to guarantee the DB state changes while we hold the Redis lock
        await db.flush()
    
    # 4. CRM Logic: Resolve Customer
    customer_id = booking_in.customer_id
    if not customer_id and booking_in.customer_name:
        # Create new customer or find by phone? 
        # For MVP simple: Create new if name provided. 
        # (Real world needs phone search)
        
        # Simple Phone Search if provided
        if booking_in.customer_phone:
             stmt = select(Customer).where(
                 Customer.tenant_id == tenant_id, 
                 Customer.phone == booking_in.customer_phone
             )
             result = await db.execute(stmt)
             existing_customer = result.scalar_one_or_none()
             if existing_customer:
                 customer_id = existing_customer.id
        
        if not customer_id:
            new_customer = Customer(
                tenant_id=tenant_id,
                full_name=booking_in.customer_name,
                phone=booking_in.customer_phone,
                visit_count=0,
                total_spent=0
            )
            db.add(new_customer)
            await db.flush() # Get ID
            customer_id = new_customer.id

    # 5. Revenue Logic: Calculate Commission
    commission_val = 0.0
    if booking_in.staff_id:
        commission_val = await calculate_commission(
            db=db,
            tenant_id=tenant_id,
            staff_id=booking_in.staff_id,
            service_id=booking_in.service_id,
            price=service.price
        )

    # ---> Phase J & O Integration (Dynamic Yield)
    from app.api.v1.endpoints.pricing import get_surge_status
    surge_data = await get_surge_status(db)
    multiplier = surge_data.get("global_multiplier", 1.0)
    
    # Calculate final scaled price
    from decimal import Decimal
    scaled_price = float(Decimal(str(service.price)) * Decimal(str(multiplier)))
    
    # Update service demand_multiplier for UI reflections
    service.demand_multiplier = multiplier
    service.current_price_eur = scaled_price

    # 6. Create Booking
    # V11: The Currency Vault
    vault_data = await apply_currency_vault_snapshot(db, local_amount=scaled_price, local_currency=service.currency, base_currency="EUR")

    booking = Booking(
        tenant_id=tenant_id,
        user_id=current_user.id, # Booker (Staff/Receptionist)
        customer_id=customer_id, # Guest
        service_id=booking_in.service_id,
        staff_id=slot.staff_id or booking_in.staff_id,
        room_id=slot.resource_id or booking_in.room_id,
        start_time=booking_in.start_time,
        end_time=end_time,
        price_snapshot=scaled_price, # Mühürlü Fiyat (Yield Applied)
        currency_snapshot=service.currency,
        fx_rate_snapshot=vault_data["fx_rate_snapshot"],
        local_currency=vault_data["local_currency"],
        base_currency_amount=vault_data["base_currency_amount"],
        commission_snapshot=commission_val,
        status=BookingStatus.PENDING # Or BOOKED if payment is upfront
    )
    
    db.add(booking)
    await db.flush() # Get booking ID
    
    # Tie the precomputed slot exclusively to this booking
    slot.booking_id = booking.id
    slot.status = BookingStatus.CONFIRMED # Lock it permanently until canceled
    
    # 7. Update Analytics (CRM & Revenue)
    # Update Customer Stats
    if customer_id:
        customer = await db.get(Customer, customer_id)
        if customer:
            customer.visit_count += 1
            customer.total_spent = float(Decimal(str(customer.total_spent)) + Decimal(str(scaled_price)))
            customer.last_visit = datetime.utcnow()
    
    # Update Daily Revenue Cache
    from app.core.reporting import update_revenue_analytics
    await update_revenue_analytics(
        db=db,
        tenant_id=tenant_id,
        amount=float(scaled_price),
        booking_date=booking_in.start_time.date()
    )

    # Phase D: Create AI Semantic Graph Edge
    if customer_id:
        edge = ContentEdge(
            source_id=str(customer_id),
            source_type="guest",
            edge_type="purchased",
            target_id=str(service.id),
            target_type="service",
            metadata_json={"source": "dashboard", "revenue": float(scaled_price)}
        )
        db.add(edge)

    await db.commit()
    await db.refresh(booking)

    # 8. Neural Bridge Matrix HQ Live Sync (Phase 3)
    from app.core.websocket import manager
    import asyncio
    
    sync_payload = {
        "type": "CONVERSION_PING",
        "action": "New Standard Booking",
        "guest_name": booking_in.customer_name or "Guest",
        "service": service.name,
        "revenue": float(scaled_price),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Fire and Forget Broadcast to HQ Global Room
    asyncio.create_task(manager.broadcast_to_room(sync_payload, "hq_global"))

    # Phase V12: Sovereign Event Bus Injection
    EventBus.emit(
        event_name="booking_created",
        payload={
            "revenue_eur": float(vault_data["base_currency_amount"]),
            "service_name": service.name,
            "surge_multiplier": multiplier,
            "is_vip": customer.total_spent > 1000 if 'customer' in locals() else False,
            "city": current_tenant.city if hasattr(current_tenant, 'city') else "Unknown"
        },
        tenant_id=str(tenant_id),
        user_id=str(customer_id) if customer_id else None
    )

    return booking

from app.core.tenant_scope import scoped_query

@router.get("/", response_model=List[schemas.BookingOut])
async def get_bookings(
    start_date: datetime,
    end_date: datetime,
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.require_permission(Permission.BOOKING_READ)),
    current_tenant: Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Retrieve bookings for a specific date range.
    - Superusers: All bookings (soft-deleted filtered).
    - Tenant Admins: Only bookings in their tenant.
    """
    from sqlalchemy.orm import selectinload
    
    # 1. Base Query with Tenant Scope & Soft Delete
    filters = [
        Booking.start_time >= start_date,
        Booking.start_time <= end_date
    ]
    stmt = scoped_query(Booking, current_user, filters=filters)
    
    # 2. Eager Load
    stmt = stmt.options(
        selectinload(Booking.service),
        selectinload(Booking.customer)
    )
    
    result = await db.execute(stmt)
    bookings = result.scalars().all()
    return bookings

@router.patch("/{booking_id}", response_model=schemas.BookingOut)
async def update_booking(
    booking_id: uuid.UUID,
    booking_in: schemas.BookingUpdate,
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
    current_tenant: Tenant = Depends(deps.get_current_tenant),
) -> Any:
    """
    Update a booking.
    """
    # 1. Get Booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.tenant_id != current_tenant.id:
        raise HTTPException(status_code=403, detail="Not enough privileges")

    # 2. Update logic
    if booking_in.start_time:
        # Calculate new end time
        service = await db.get(Service, booking.service_id)
        if not service:
            raise HTTPException(status_code=404, detail="Associated service not found (integrity error)")

        new_end_time = booking_in.start_time + timedelta(minutes=service.duration_minutes)
        
        availability = await check_availability(
            db=db,
            tenant_id=current_user.tenant_id,
            start_time=booking_in.start_time,
            end_time=new_end_time,
            staff_id=booking_in.staff_id or booking.staff_id,
            room_id=booking_in.room_id or booking.room_id,
            exclude_booking_id=booking_id
        )
        
        if not availability["is_available"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Reschedule failed! Conflict with {availability['conflict_reason']}."
            )
            
        booking.start_time = booking_in.start_time
        booking.end_time = new_end_time

    if booking_in.status:
        old_status = booking.status
        booking.status = booking_in.status

        # ── PHASE M: Cancellation Liquidity Recovery Hook ──────────
        if (
            booking_in.status == BookingStatus.CANCELLED
            and old_status != BookingStatus.CANCELLED
            and booking.start_time
        ):
            hours_to_start = (booking.start_time - datetime.utcnow()).total_seconds() / 3600
            if 0 < hours_to_start < 3:
                import asyncio as _asyncio
                try:
                    from server import flash_recovery_trigger
                    _asyncio.create_task(flash_recovery_trigger(
                        booking_id=str(booking.id),
                        service_id=str(booking.service_id),
                        start_time=booking.start_time.isoformat(),
                        hours_left=round(hours_to_start, 2)
                    ))
                except Exception as _e:
                    print(f"[Phase M] Hook error: {_e}")
        # ───────────────────────────────────────────────────────────

    if booking_in.staff_id:
        booking.staff_id = booking_in.staff_id
    if booking_in.room_id:
        booking.room_id = booking_in.room_id
        
    await db.commit()
    await db.refresh(booking)
    
    # Eager load for response
    from sqlalchemy.orm import selectinload
    stmt = select(Booking).where(Booking.id == booking_id).options(
        selectinload(Booking.service),
        selectinload(Booking.customer)
    )
    result = await db.execute(stmt)
    updated_booking = result.scalar_one()
    
    return updated_booking

from app.core.permissions import Permission

@router.delete("/{booking_id}", status_code=status.HTTP_200_OK)
async def delete_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_for_admin),
    current_user: deps.models.User = Depends(deps.require_permission(Permission.BOOKING_DELETE)),
) -> Any:
    """
    Soft delete a booking.
    """
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if already deleted
    if booking.is_deleted:
        raise HTTPException(status_code=409, detail="Booking already deleted")

    # Tenant Guard
    deps.enforce_tenant_scope(booking, current_user)
    
    # Soft Delete Logic
    booking.is_deleted = True
    booking.deleted_at = datetime.utcnow()
    booking.deleted_by = current_user.id
    
    # Audit Log
    from app.services.audit import AuditService, AuditAction, AuditStatus
    await AuditService.log(
        db=db,
        action=AuditAction.DELETE,
        actor_id=current_user.id,
        tenant_id=booking.tenant_id,
        entity_type="Booking",
        entity_id=booking.id,
        details={"soft_delete": True, "service_id": str(booking.service_id)},
        status=AuditStatus.SUCCESS
    )

    await db.commit()
    return {"status": "success", "message": "Booking soft deleted"}

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
