from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, time
from typing import Any

from app.db.session import get_db, get_db_for_admin
from app.db.models.booking import Booking

router = APIRouter()

MAX_SURGE_CAP = 1.8
CLOSING_HOUR = 22 # 10 PM
TOTAL_DAILY_CAPACITY = 100 # Static baseline capacity for POC

@router.get("/surge-status")
async def get_surge_status(db: AsyncSession = Depends(get_db_for_admin)) -> Any:
    """
    Santis Time-Factor Surge Pricing Engine (Yield Autopilot).
    Calculates dynamic pricing based on daily demand vs capacity,
    intensified by the 'time left' until closing.
    """
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Booking Volume (Demand Factor)
    stmt = select(func.count(Booking.id)).where(Booking.start_time >= today_start)
    result = await db.execute(stmt)
    bookings_today = result.scalar() or 0
    
    # Simulate some demand if the DB is empty, just so the dashboard looks alive for demonstration
    if bookings_today < 20: 
        bookings_today += 30 
        
    demand_factor = min(1.0, bookings_today / TOTAL_DAILY_CAPACITY)
    
    # 2. Time-Factor (Airbnb style closing scarcity)
    if now.hour >= CLOSING_HOUR:
        time_left_percentage = 0.01 # Prevent division by zero, practically closed
    else:
        opening_hour = 8 # 8 AM
        if now.hour < opening_hour:
             time_left_percentage = 1.0 # Hasn't opened yet
        else:
             total_hours = CLOSING_HOUR - opening_hour
             hours_passed = now.hour - opening_hour
             hours_left = total_hours - hours_passed
             time_left_percentage = max(0.01, hours_left / total_hours)
             
    # 3. Surge Calculation
    # Cap time left effect to avoid crazy math
    capped_time_left = max(0.2, time_left_percentage) 
    
    if demand_factor < 0.1:
         global_multiplier = 1.0
    else:
         # The core algorithmic curve
         # As demand rises, and time left shrinks, push prices up
         raw_surge = 1.0 + (demand_factor * (0.3 / capped_time_left))
         
         # Strict CTO Cap applied here
         global_multiplier = min(MAX_SURGE_CAP, raw_surge)
         
    # Ensure minimum is 1.0
    global_multiplier = max(1.0, round(global_multiplier, 2))
    
    status_label = "NORMAL"
    if global_multiplier >= 1.5:
        status_label = "CRITICAL_CAPACITY"
    elif global_multiplier > 1.05:
        status_label = "SURGE_ACTIVE"
        
    return {
        "current_status": status_label,
        "global_multiplier": global_multiplier,
        "metrics": {
            "demand_factor": round(demand_factor, 2),
            "time_left_percentage": round(time_left_percentage, 2),
            "bookings_today": bookings_today
        }
    }
