from typing import Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.schemas import booking as schemas
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service
from app.db.models.staff import Staff
from app.db.models.room import Room
from app.db.models.customer import Customer
from app.db.session import get_db
from app.core.logic.booking import check_availability
import uuid
from app.core.permissions import Permission

router = APIRouter()

@router.post("/services", response_model=schemas.ServiceOut)
async def create_service(
    service_in: schemas.ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
) -> Any:
    service = Service(
        tenant_id=current_user.tenant_id,
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
    db: AsyncSession = Depends(get_db),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
) -> Any:
    staff = Staff(
        tenant_id=current_user.tenant_id,
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
    db: AsyncSession = Depends(get_db),
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

@router.post("/", response_model=schemas.BookingOut)
async def create_booking(
    booking_in: schemas.BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: deps.models.User = Depends(deps.get_current_user), 
) -> Any:
    """
    Create a new booking with strict overlap checking + Revenue/CRM Logic.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
         raise HTTPException(status_code=400, detail="User must belong to a tenant to create booking.")

    # 1. Get Service details
    service = await db.get(Service, booking_in.service_id)
    if not service or service.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Service not found")

    # 2. Calculate End Time
    end_time = booking_in.start_time + timedelta(minutes=service.duration_minutes)

    # 3. Availability Check
    availability = await check_availability(
        db=db,
        tenant_id=tenant_id,
        start_time=booking_in.start_time,
        end_time=end_time,
        staff_id=booking_in.staff_id,
        room_id=booking_in.room_id
    )

    if not availability["is_available"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Double booking detected! Conflict with {availability['conflict_reason']}."
        )
    
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

    # 6. Create Booking
    booking = Booking(
        tenant_id=tenant_id,
        user_id=current_user.id, # Booker (Staff/Receptionist)
        customer_id=customer_id, # Guest
        service_id=booking_in.service_id,
        staff_id=booking_in.staff_id,
        room_id=booking_in.room_id,
        start_time=booking_in.start_time,
        end_time=end_time,
        price_snapshot=service.price,
        currency_snapshot=service.currency,
        commission_snapshot=commission_val,
        status=BookingStatus.PENDING
    )
    
    db.add(booking)
    
    # 7. Update Analytics (CRM & Revenue)
    # Update Customer Stats
    if customer_id:
        customer = await db.get(Customer, customer_id)
        if customer:
            customer.visit_count += 1
            customer.total_spent = float(Decimal(str(customer.total_spent)) + Decimal(str(service.price)))
            customer.last_visit = datetime.utcnow()
    
    # Update Daily Revenue Cache
    await update_revenue_analytics(
        db=db,
        tenant_id=tenant_id,
        amount=float(service.price),
        booking_date=booking_in.start_time.date()
    )

    await db.commit()
    await db.refresh(booking)
    return booking

from app.core.tenant_scope import scoped_query

@router.get("/", response_model=List[schemas.BookingOut])
async def get_bookings(
    start_date: datetime,
    end_date: datetime,
    db: AsyncSession = Depends(get_db),
    current_user: deps.models.User = Depends(deps.require_permission(Permission.BOOKING_READ)),
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
    db: AsyncSession = Depends(get_db),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
) -> Any:
    """
    Update a booking.
    """
    # 1. Get Booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.tenant_id != current_user.tenant_id:
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
        booking.status = booking_in.status
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
    db: AsyncSession = Depends(get_db),
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