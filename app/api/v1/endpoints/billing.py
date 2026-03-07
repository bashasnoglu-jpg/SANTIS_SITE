from __future__ import annotations
"""
SANTIS BILLING ENGINE v2.0 — Sprint 4
Stripe abonelik yönetimi, plan limitleri, webhook, usage API
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel
from typing import Optional
import uuid, os
from decimal import Decimal
from datetime import datetime

from datetime import datetime
import hashlib
from loguru import logger

from app.db.session import get_db_for_admin as _gdb
from app.api import deps

router = APIRouter()

# ─── PLAN TANIMLARI ─────────────────────────────────────────────────────────
PLANS = {
    "starter": {
        "name":        "Starter",
        "price_eur":   49,
        "price_try":   999,
        "ai_messages": 50,
        "bookings":    500,
        "branches":    1,
        "stripe_price_id": os.getenv("STRIPE_PRICE_STARTER", "price_starter_placeholder"),
    },
    "pro": {
        "name":        "Pro",
        "price_eur":   99,
        "price_try":   2499,
        "ai_messages": 500,
        "bookings":    9999,
        "branches":    3,
        "stripe_price_id": os.getenv("STRIPE_PRICE_PRO", "price_pro_placeholder"),
    },
    "enterprise": {
        "name":        "Enterprise",
        "price_eur":   299,
        "price_try":   7499,
        "ai_messages": 9999,
        "bookings":    99999,
        "branches":    99,
        "stripe_price_id": os.getenv("STRIPE_PRICE_ENTERPRISE", "price_enterprise_placeholder"),
    },
}

# ─── YARDIMCI: Stripe import (API key yoksa mock mode) ───────────────────────
def _get_stripe():
    try:
        import stripe as _stripe
        key = os.getenv("STRIPE_SECRET_KEY", "")
        if key and key.startswith("sk_"):
            _stripe.api_key = key
            return _stripe
    except ImportError:
        pass
    return None  # Mock mode

# ─── ENDPOINT: Plan Listesi ──────────────────────────────────────────────────
@router.get("/plans", summary="Mevcut SaaS Planları")
async def list_plans():
    """Santis'in SaaS plan katalogunu döndürür."""
    return {
        "plans": [
            {
                "id":    pid,
                "name":  p["name"],
                "price_eur": p["price_eur"],
                "price_try": p["price_try"],
                "limits": {
                    "ai_messages": p["ai_messages"],
                    "bookings":    p["bookings"],
                    "branches":    p["branches"],
                }
            }
            for pid, p in PLANS.items()
        ]
    }

# ─── ENDPOINT: Checkout (Stripe Session Oluştur) ─────────────────────────────
class CheckoutRequest(BaseModel):
    tenant_id: str
    plan: str = "pro"
    success_url: str = "http://localhost:8000/admin/billing-success.html"
    cancel_url:  str = "http://localhost:8000/admin/billing-cancel.html"

@router.post("/checkout", summary="Stripe Checkout Oturumu Oluştur")
async def create_checkout(
    req: CheckoutRequest,
    db: AsyncSession = Depends(_gdb),
):
    plan = PLANS.get(req.plan)
    if not plan:
        raise HTTPException(400, f"Geçersiz plan: {req.plan}. Seçenekler: {list(PLANS.keys())}")

    stripe = _get_stripe()
    if stripe:
        # Gerçek Stripe modu
        try:
            raw_key = f"checkout_req:{req.tenant_id}:{req.plan}:{datetime.utcnow().strftime('%Y-%m-%d-%H')}"
            idem_key = hashlib.sha256(raw_key.encode()).hexdigest()
            logger.info(f"💳 [STRIPE] Checkout başlatılıyor. Idempotency Key: {idem_key}")

            session = stripe.checkout.Session.create(
                mode="subscription",
                line_items=[{"price": plan["stripe_price_id"], "quantity": 1}],
                success_url=req.success_url + "?session_id={CHECKOUT_SESSION_ID}",
                cancel_url=req.cancel_url,
                metadata={"tenant_id": req.tenant_id, "plan": req.plan},
                client_reference_id=req.tenant_id,
                idempotency_key=idem_key
            )
            return {
                "checkout_url": session.url,
                "session_id":   session.id,
                "plan":         req.plan,
                "mode":         "stripe_live",
            }
        except Exception as e:
            raise HTTPException(500, f"Stripe hatası: {e}")
    else:
        # Mock mode (Stripe API key yok)
        mock_session_id = f"mock_cs_{uuid.uuid4().hex[:16]}"
        return {
            "checkout_url": f"{req.success_url}?session_id={mock_session_id}&mock=true",
            "session_id":   mock_session_id,
            "plan":         req.plan,
            "price_eur":    plan["price_eur"],
            "price_try":    plan["price_try"],
            "mode":         "mock_no_stripe_key",
            "note":         "STRIPE_SECRET_KEY .env'e eklenince gerçek ödeme aktif olur.",
        }

# ─── ENDPOINT: Stripe Webhook ────────────────────────────────────────────────
@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(_gdb),
    stripe_signature: Optional[str] = Header(None),
):
    body = await request.body()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    stripe = _get_stripe()

    if stripe and webhook_secret:
        try:
            event = stripe.Webhook.construct_event(body, stripe_signature, webhook_secret)
        except stripe.error.SignatureVerificationError:
            logger.critical("🚨 [WEBHOOK HACK ATTEMPT] Geçersiz imza!")
            raise HTTPException(400, "Invalid signature")
        except Exception as e:
            raise HTTPException(400, f"Webhook imza hatası: {e}")
    else:
        # Mock: body'yi doğrudan parse et
        import json
        try:
            event = json.loads(body)
        except Exception:
            return {"status": "ignored"}

    etype = event.get("type", "")

    # Ödeme başarılı → tenant planını güncelle
    if etype == "checkout.session.completed":
        session = event.get("data", {}).get("object", {})
        tenant_id = session.get("metadata", {}).get("tenant_id") or session.get("client_reference_id")
        plan      = session.get("metadata", {}).get("plan", "pro")
        stripe_sub_id = session.get("subscription")

        if tenant_id:
            logger.info(f"⚡ [STRIPE WEBHOOK] Ödeme başarılı: Tenant {tenant_id}, Sub: {stripe_sub_id}")
            # STATE MACHINE KONTROLÜ
            res = await db.execute(text("SELECT status FROM tenant_subscriptions WHERE stripe_sub_id = :s_id"), {"s_id": str(stripe_sub_id)})
            current_row = res.fetchone()
            
            if current_row and current_row[0] in ["active", "paid", "completed"]:
                logger.info(f"🔁 [STATE MACHINE] Ödeme {stripe_sub_id} zaten '{current_row[0]}' durumunda. Duplicate event atlanıyor.")
                return {"status": "already_processed"}
            
            logger.success(f"💰 [REVENUE STRIKE] {tenant_id} için ödeme alındı. State PENDING -> ACTIVE")

            await db.execute(text("""
                INSERT INTO tenant_subscriptions (tenant_id, plan, status, stripe_sub_id, updated_at)
                VALUES (:tid::uuid, :plan, 'active', :sub_id, NOW())
                ON CONFLICT (tenant_id) DO UPDATE
                SET plan=:plan, status='active', stripe_sub_id=:sub_id, updated_at=NOW()
            """), {"tid": tenant_id, "plan": plan, "sub_id": stripe_sub_id})
            await db.commit()

    # Abonelik iptal → is_active false
    elif etype in ("customer.subscription.deleted", "invoice.payment_failed"):
        obj = event.get("data", {}).get("object", {})
        stripe_sub_id = obj.get("id")
        if stripe_sub_id:
            await db.execute(text("""
                UPDATE tenant_subscriptions SET status='canceled', updated_at=NOW()
                WHERE stripe_sub_id=:sub_id
            """), {"sub_id": stripe_sub_id})
            await db.commit()

    return {"status": "ok", "event_type": etype}

# ─── ENDPOINT: Mevcut Abonelik Durumu ────────────────────────────────────────
@router.get("/status/{tenant_id}", summary="Tenant Abonelik Durumu")
async def subscription_status(
    tenant_id: str,
    db: AsyncSession = Depends(_gdb),
):
    result = await db.execute(text("""
        SELECT s.plan, s.status, s.current_period_end, s.cancel_at_end,
               u.ai_messages, u.bookings_count
        FROM tenant_subscriptions s
        LEFT JOIN usage_counters u ON u.tenant_id = s.tenant_id
          AND u.period_start = DATE_TRUNC('month', NOW())
        WHERE s.tenant_id = :tid::uuid
    """), {"tid": tenant_id})
    row = result.fetchone()
    if not row:
        return {"plan": "none", "status": "no_subscription"}

    plan_def = PLANS.get(row[0], PLANS["starter"])
    ai_used  = row[4] or 0
    bk_used  = row[5] or 0

    return {
        "tenant_id":  tenant_id,
        "plan":       row[0],
        "status":     row[1],
        "period_end": row[2].isoformat() if row[2] else None,
        "cancel_at_end": row[3],
        "usage": {
            "ai_messages":  {"used": ai_used,  "limit": plan_def["ai_messages"]},
            "bookings":     {"used": bk_used,  "limit": plan_def["bookings"]},
        },
        "plan_details": {
            "price_eur": plan_def["price_eur"],
            "price_try": plan_def["price_try"],
        }
    }

# ─── ENDPOINT: Kullanimi Arttir (Counter) ────────────────────────────────────
class UsageRequest(BaseModel):
    tenant_id: str
    type: str  # "ai_message" | "booking"

@router.post("/usage/increment", include_in_schema=False)
async def increment_usage(req: UsageRequest, db: AsyncSession = Depends(_gdb)):
    col = "ai_messages" if req.type == "ai_message" else "bookings_count"
    await db.execute(text(f"""
        INSERT INTO usage_counters (tenant_id, period_start, {col})
        VALUES (:tid::uuid, DATE_TRUNC('month', NOW()), 1)
        ON CONFLICT (tenant_id, period_start)
        DO UPDATE SET {col} = usage_counters.{col} + 1, updated_at = NOW()
    """), {"tid": req.tenant_id})
    await db.commit()
    return {"status": "ok"}

# ─── LEGACY: Eski checkout endpoint uyumluluğu ────────────────────────────────
@router.post("/checkout-legacy")
async def process_sovereign_checkout_legacy(
    items: list = [],
    total_fiat_amount: Decimal = Decimal("0"),
    currency: str = "EUR",
    payment_method: str = "FIAT",
    x_tenant_id: Optional[str] = Header(None),
):
    """Eski mock checkout — geriye dönük uyumluluk."""
    import uuid as _uuid
    transaction_id = f"sov_tx_{_uuid.uuid4().hex[:12]}"
    return {
        "transaction_id": transaction_id,
        "status": "MOCK_LEGACY",
        "amount_due": float(total_fiat_amount),
        "note": "Yeni /api/v1/billing/checkout endpoint'ini kullanın.",
    }
