from typing import Any, Optional
from datetime import date, timedelta, datetime
import sys
import traceback
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.api import deps
from app.db.session import get_db
from app.db.models.revenue import DailyRevenue
from app.db.models.booking import Booking, BookingStatus
from app.db.models.staff import Staff
from app.db.models.service import Service
from app.schemas import revenue as schemas

# ... imports ...

router = APIRouter()

@router.get("/daily")  # response_model intentionally omitted to allow manual encoding
async def get_daily_revenue(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: deps.models.User = Depends(deps.get_current_active_manager),
) -> Any:
    """
    Get daily revenue stats and top performers for a specific date range.
    Default: Last 30 days.
    """
    tenant_id = current_user.tenant_id
    
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
        
    try:
        # 1. Fetch Daily Revenue Breakdown
        stmt = select(DailyRevenue).where(
            DailyRevenue.tenant_id == tenant_id,
            DailyRevenue.date >= start_date,
            DailyRevenue.date <= end_date
        ).order_by(DailyRevenue.date)
        
        result = await db.execute(stmt)
        daily_data = result.scalars().all()
        
        # Calculate Totals (Safe handling for None)
        total_rev = sum((d.daily_revenue or Decimal(0)) for d in daily_data)
        total_bk = sum((d.booking_count or 0) for d in daily_data)

        # 1b. Fix Pydantic Serialization (Ensure explicitly safe for None values)
        safe_daily_data = []
        for d in daily_data:
            safe_daily_data.append(schemas.DailyRevenueOut(
                date=d.date,
                daily_revenue=d.daily_revenue or Decimal(0.0),
                booking_count=d.booking_count or 0
            ))
        
        # 2. Top Staff
        staff_stmt = (
            select(
                Booking.staff_id,
                Staff.name,
                func.sum(Booking.price_snapshot).label("total_revenue"),
                func.count(Booking.id).label("booking_count")
            )
            .join(Staff, Booking.staff_id == Staff.id)
            .where(
                Booking.tenant_id == tenant_id,
                Booking.status != BookingStatus.CANCELLED,
                func.date(Booking.start_time) >= start_date,
                func.date(Booking.start_time) <= end_date
            )
            .group_by(Booking.staff_id, Staff.name)
            .order_by(desc("total_revenue"))
            .limit(5)
        )
        
        staff_res = await db.execute(staff_stmt)
        top_staff = []
        for row in staff_res.all():
            top_staff.append(schemas.TopPerformer(
                id=row.staff_id,
                name=row.name,
                revenue=row.total_revenue or Decimal(0),
                count=row.booking_count
            ))
        
        # 3. Top Services
        service_stmt = (
            select(
                Booking.service_id,
                Service.name,
                func.sum(Booking.price_snapshot).label("total_revenue"),
                func.count(Booking.id).label("booking_count")
            )
            .join(Service, Booking.service_id == Service.id)
            .where(
                Booking.tenant_id == tenant_id,
                Booking.status != BookingStatus.CANCELLED,
                func.date(Booking.start_time) >= start_date,
                func.date(Booking.start_time) <= end_date
            )
            .group_by(Booking.service_id, Service.name)
            .order_by(desc("total_revenue"))
            .limit(5)
        )
        
        service_res = await db.execute(service_stmt)
        top_services = []
        for row in service_res.all():
            top_services.append(schemas.TopPerformer(
                id=row.service_id,
                name=row.name,
                revenue=row.total_revenue or Decimal(0),
                count=row.booking_count
            ))

            # Construct Response Object
        response_obj = schemas.AnalyticsOut(
            period_start=start_date,
            period_end=end_date,
            revenue_stats=schemas.RevenueStats(
                total_revenue=total_rev,
                total_bookings=total_bk,
                daily_breakdown=safe_daily_data
            ),
            top_staff=top_staff,
            top_services=top_services
        )
        
        # Serialize manually to catch serialization errors
        json_data = jsonable_encoder(response_obj)
        
        return JSONResponse(status_code=200, content=json_data)

    except Exception as e:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("CRITICAL ERROR IN GET_DAILY_REVENUE")
        traceback.print_exc()
        print(f"Error details: {e}")
        
        # Write to file
        with open("error_log.txt", "a") as f:
            f.write(f"\n--- ERROR {datetime.now()} ---\n")
            f.write(traceback.format_exc())
            f.write(f"Error: {e}\n")
            
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        # Return 500 with details to the client (for debugging purposes only!)
        return JSONResponse(
            status_code=500, 
            content={"detail": "Internal Server Error", "error": str(e), "trace": traceback.format_exc()}
        )
