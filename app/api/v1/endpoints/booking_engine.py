from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi import APIRouter

router = APIRouter(prefix="/booking", tags=["booking"])


class BookingAvailabilityRequest(BaseModel):
    ritualTitle: str = Field(..., min_length=2)
    category: Optional[str] = None
    duration: Optional[str] = None
    intent: Optional[str] = None
    atmosphere: Optional[str] = None
    preferredDate: str = Field(..., min_length=4)
    preferredTime: str = Field(..., min_length=4)
    partySize: int = Field(1, ge=1, le=6)
    source: str = "booking-modal"


class BookingAvailabilityResponse(BaseModel):
    available: bool
    confirmationMode: str = "host-review"
    message: str
    alternatives: List[str] = []


@router.post("/availability", response_model=BookingAvailabilityResponse)
async def check_booking_availability(payload: BookingAvailabilityRequest):
    hour = int(payload.preferredTime.split(":")[0])

    if hour < 10 or hour > 20:
        return BookingAvailabilityResponse(
            available=False,
            message="Bu saat aralığı dışında müsaitlik bulunmuyor.",
            alternatives=["11:00", "14:00", "17:30"],
        )

    return BookingAvailabilityResponse(
        available=True,
        message="Seçtiğiniz zaman ön uygunluk kontrolünden geçti. Spa ekibi tarafından teyit edilecektir.",
        alternatives=[],
    )
