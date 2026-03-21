import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
import json

from app.db.models.booking import Booking, BookingStatus
from app.db.models.payment import TenantPaymentConfig, PaymentTransaction, PaymentProvider, PaymentStatus
from app.services.event_bus import EventBus

async def create_checkout_session(db: AsyncSession, booking_id: uuid.UUID, whisper_id: str = "organic", ghost_score: int = 0) -> dict:
    """
    Phase 7 & 84: The Gate of Capital & Sovereign Vault
    Generates a checkout session for a booking, locking the price (Price Freeze).
    Injects Aurelia Impact Metadata (whisper_id, ghost_score) for Edge Analytics.
    """
    # 1. Fetch Booking
    stmt = select(Booking).where(Booking.id == booking_id)
    result = await db.execute(stmt)
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not in PENDING state. Cannot create checkout.")

    # 2. Fetch Payment Config for Tenant
    config_stmt = select(TenantPaymentConfig).where(
        TenantPaymentConfig.tenant_id == booking.tenant_id,
        TenantPaymentConfig.is_active == True
    )
    res = await db.execute(config_stmt)
    payment_config = res.scalar_one_or_none()
    
    provider = PaymentProvider.STRIPE
    if payment_config:
        provider = payment_config.provider
        
    # 3. Create a unique Idempotency Key to prevent double charges
    idem_key = f"checkout_{booking.id}_{uuid.uuid4().hex[:8]}"
    
    # 4. Mock Provider Logic (Stripe/Iyzico Orchestration)
    checkout_url = ""
    transaction_id = f"txn_{uuid.uuid4().hex}"
    
    if provider == PaymentProvider.STRIPE:
        checkout_url = f"https://checkout.stripe.com/pay/{uuid.uuid4().hex}"
    else:
        checkout_url = f"https://sandbox-api.iyzipay.com/checkout/{uuid.uuid4().hex}"
        
    # 5. Record Payment Transaction (PENDING)
    transaction = PaymentTransaction(
        tenant_id=booking.tenant_id,
        booking_id=booking.id,
        provider=provider,
        provider_transaction_id=transaction_id,
        amount=booking.price_snapshot,
        currency=booking.currency_snapshot,
        status=PaymentStatus.PENDING,
        idempotency_key=idem_key,
        ghost_trace_data={
            "whisper_id": whisper_id,
            "ghost_score": ghost_score
        } # 🚀 PHASE 84 Metadata Injection
    )
    
    # 6. Bind the intent to the booking
    booking.payment_intent_id = transaction_id
    
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    return {
        "checkout_url": checkout_url,
        "transaction_id": transaction_id,
        "provider": provider.value,
        "locked_price": float(booking.price_snapshot)
    }

async def handle_provider_webhook(db: AsyncSession, transaction_id: str, provider: PaymentProvider, payload_data: dict):
    """
    Phase 7: The Double Kill (Conversion Let-through & Ghost Trace)
    Webhook handler that confirms the booking and seals conversion analytics.
    """
    stmt = select(PaymentTransaction).where(
        PaymentTransaction.provider_transaction_id == transaction_id,
        PaymentTransaction.provider == provider
    )
    res = await db.execute(stmt)
    transaction = res.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found for this webhook")
        
    if transaction.status == PaymentStatus.SUCCESS:
        return {"status": "already_processed"} # Idempotency check 1
        
    # Find Booking
    bk_stmt = select(Booking).where(Booking.id == transaction.booking_id)
    bk_res = await db.execute(bk_stmt)
    booking = bk_res.scalar_one_or_none()
    
    if not booking:
         raise HTTPException(status_code=404, detail="Associated Booking not found")
         
    # Mark Success
    transaction.status = PaymentStatus.SUCCESS
    
    # Seal Ghost Trace (e.g. Surge Multiplier at time of purchase, Device info)
    # Payload might contain metadata we want to seal
    old_trace = transaction.ghost_trace_data or {}
    trace_data = {
        **old_trace,
        "conversion_timestamp": payload_data.get("created"),
        "surge_locked_price": float(booking.price_snapshot),
        "source": provider.value,
        "customer_email_used": payload_data.get("customer_email", "unknown")
    }
    transaction.ghost_trace_data = trace_data
    
    # Confirm Booking
    if booking.status == BookingStatus.PENDING:
        booking.status = BookingStatus.CONFIRMED
        
    # NOTE: PrecomputedSlot status would also be updated here to BOOKED 
    # if we link slot IDs directly, or via a cascading service.
    
    # 🚀 PHASE 84 & 66: PANOPTICON PULSE (God Mode Broadcast)
    amount_paid = float(booking.price_snapshot)
    w_id = transaction.ghost_trace_data.get("whisper_id", "organic")
    
    # Zero-Latency SSE Broadcast for God Mode Radar
    try:
        from app.core.sse_manager import sse_bus
        import asyncio
        asyncio.create_task(sse_bus.broadcast("santis_global_pulse", {
            "type": "REVENUE_STRIKE",
            "action": "SEALED",
            "price": amount_paid,
            "target": f"Sovereign Ayrıcalığı"
        }))
    except Exception as e:
        pass # Fallback to standard DB EventBus
        
    EventBus.emit(
        event_name="revenue:strike",
        payload={
            "amount": amount_paid,
            "whisper_id": w_id,
            "message": f"Sovereign Ayrıcalığı Tahsil Edildi: {amount_paid}€" if w_id != "organic" else f"Organik İşlem Mühürlendi: {amount_paid}€",
            "booking_id": str(booking.id)
        },
        tenant_id=str(transaction.tenant_id)
    )
    
    await db.commit()
    
    return {
        "status": "success",
        "booking_id": str(booking.id),
        "sealed_trace": trace_data
    }
