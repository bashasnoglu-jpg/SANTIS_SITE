from pydantic import BaseModel
from typing import List, Optional

class BookingCalendarItem(BaseModel):
    id: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    location_link: Optional[List[str]] = None
    environment: Optional[str] = None
    # Diğer gerekli alanlar buraya MVP sonrası eklenebilir.

class ReceptionBookingsResponse(BaseModel):
    location: str
    date: str
    bookings: List[BookingCalendarItem]
