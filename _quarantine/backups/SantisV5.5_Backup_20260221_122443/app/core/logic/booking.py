from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.db.models.booking import Booking, BookingStatus
# Correct imports based on file structure
from app.db.models.staff import Staff
from app.db.models.room import Room
import uuid

async def check_availability(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    start_time: datetime,
    end_time: datetime,
    staff_id: uuid.UUID = None,
    room_id: uuid.UUID = None,
    exclude_booking_id: uuid.UUID = None
) -> dict:
    """
    Checks if Staff or Room is available for the given time slot.
    Returns:
        {
            "is_available": bool,
            "conflict_reason": str | None ("STAFF", "ROOM", "BOTH")
        }
    """
    
    # Base query for overlapping bookings
    # Overlap logic: (StartA < EndB) and (EndA > StartB)
    query = select(Booking).where(
        Booking.tenant_id == tenant_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.start_time < end_time,
        Booking.end_time > start_time
    )

    if exclude_booking_id:
        query = query.where(Booking.id != exclude_booking_id)

    # Check Staff Conflict
    if staff_id:
        staff_query = query.where(Booking.staff_id == staff_id)
        result = await db.execute(staff_query)
        if result.first():
            return {"is_available": False, "conflict_reason": "STAFF"}

    # Check Room Conflict
    if room_id:
        room_query = query.where(Booking.room_id == room_id)
        result = await db.execute(room_query)
        if result.first():
            return {"is_available": False, "conflict_reason": "ROOM"}

    return {"is_available": True, "conflict_reason": None}
