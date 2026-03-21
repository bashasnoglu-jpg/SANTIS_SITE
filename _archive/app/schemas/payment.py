from pydantic import BaseModel, HttpUrl
import uuid
from typing import Optional, Dict, Any
from app.db.models.payment import PaymentProvider

class CheckoutSessionRequest(BaseModel):
    booking_id: uuid.UUID

class CheckoutSessionResponse(BaseModel):
    status: str
    checkout_url: str
    provider: PaymentProvider
    transaction_id: str

class WebhookStripePayload(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]

class CreateCheckoutSessionRequest(BaseModel):
    amount: float
    currency: str = "eur"
    user_id: uuid.UUID

    class Config:
        schema_extra = {
            "example": {
                "amount": 250.0,
                "currency": "eur",
                "user_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }

class CreateCheckoutSessionResponse(BaseModel):
    client_secret: str
    checkout_session_id: uuid.UUID
    
# Tenant Payment configuration
class TenantPaymentConfigBase(BaseModel):
    provider: PaymentProvider
    is_active: bool = True
    public_key: str
    secret_key: str
    webhook_secret: Optional[str] = None

class TenantPaymentConfigCreate(TenantPaymentConfigBase):
    pass

class TenantPaymentConfigResponse(TenantPaymentConfigBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True
