from pydantic import BaseModel, Field
from typing import Optional
from fastapi import APIRouter

router = APIRouter(prefix="/billing", tags=["billing"])


class CheckoutSessionRequest(BaseModel):
    ritualTitle: str = Field(..., min_length=2)
    preferredDate: str = Field(..., min_length=4)
    preferredTime: str = Field(..., min_length=4)
    price: Optional[int] = Field(None, ge=1)
    currency: str = "EUR"
    source: str = "stripe-session-shell"


class CheckoutSessionResponse(BaseModel):
    ready: bool
    reason: str
    message: str
    sessionUrl: Optional[str] = None


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(payload: CheckoutSessionRequest):
    if not payload.price:
        return CheckoutSessionResponse(
            ready=False,
            reason="price_required",
            message="Fiyat bilgisi teyit edilmeden ödeme oturumu açılamaz.",
        )

    return CheckoutSessionResponse(
        ready=False,
        reason="stripe_not_configured",
        message="Ödeme oturumu henüz aktif değil. Spa ekibi fiyat ve zaman bilgisini teyit ettikten sonra açılacaktır.",
    )
