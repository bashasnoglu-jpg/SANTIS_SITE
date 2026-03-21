from __future__ import annotations
import time
import stripe
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from loguru import logger
import os

# Stripe Key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_SovereignMasterKey_Simulated")

# Sprint 1 & 2'de kurduğumuz sömürü kalkanı (IP tabanlı)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

class HesitationSignal(BaseModel):
    product_id: str
    original_price: float
    currency: str = "eur"

@router.post("/hesitation")
@limiter.limit("2/hour") # 🚨 SÖMÜRÜ ZIRHI: Bir müşteri saatte sadece 2 kez fiyat bükebilir!
async def trigger_hesitation_arbitrage(request: Request, signal: HesitationSignal):
    """
    Kuantum Fiyat Bükme Motoru.
    Müşterinin kararsızlığını yakalar, %15 indirimli tek kullanımlık Stripe URL'i üretir.
    """
    try:
        # 1. Kognitif İndirim Matematiği (%15 FOMO İndirimi)
        discount_rate = 0.15
        new_price = round(signal.original_price * (1 - discount_rate), 2)
        new_price_cents = int(new_price * 100)

        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"🧠 [HESITATION ARBITRAGE] Kararsızlık yakalandı! IP: {client_ip} | "
                    f"Ürün: {signal.product_id} | Eski: {signal.original_price}€ -> Yeni: {new_price}€")

        # 2. Stripe Inline Price (Dinamik Fiyat) ile Session Üretimi
        # Normalde Stripe'da expires_at en az 30 dakika sonrasına ayarlanabilir (Stripe limitasyonu).
        # Biz Stripe'a 30 dk vereceğiz ama Frontend'de müşteriye "15 Dakikan Var!" diyerek FOMO yaratacağız.
        expiration_epoch = int(time.time()) + (30 * 60)

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': signal.currency,
                    'product_data': {
                        'name': f'👑 SOVEREIGN VIP: {signal.product_id}',
                        'description': 'Kognitif sadakat algoritması tarafından size özel atanmış tek seferlik fiyat.',
                    },
                    'unit_amount': new_price_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            expires_at=expiration_epoch,
            success_url='https://santis.os/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='https://santis.os/checkout/hesitation_lost',
            client_reference_id=client_ip # Webhook'ta ödemeyi kimin yaptığını bilmek için
        )

        # 3. Frontend'in DOM Mutasyonu İçin İhtiyaç Duyduğu Cephane
        return {
            "status": "reality_distorted",
            "original_price": signal.original_price,
            "new_price": new_price,
            "expires_in_seconds": 15 * 60, # UI'da 15:00'dan geriye sayacak acımasız sayaç (900 sn)
            "checkout_url": session.url
        }

    except stripe.error.StripeError as e:
        logger.error(f"🚨 [STRIPE FOMO ERROR] Arbitraj çöktü: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stripe Error: {str(e)}")
    except Exception as e:
        logger.exception("💥 [SYSTEM ERROR] Beklenmeyen Hesitation Hatası")
        raise HTTPException(status_code=500, detail=f"System Error: {str(e)}")
