from __future__ import annotations
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from loguru import logger
import stripe
import os
import json
import hashlib
from typing import Optional

router = APIRouter()

def generate_idempotency_key(user_id: str, product_id: str, cart_hash: str) -> str:
    """ 
    Deterministik Idempotency Key. 
    Aynı kullanıcı, aynı sepet içeriğiyle istek atarsa hep aynı hash üretilir.
    """
    raw_key = f"checkout_req:{user_id}:{product_id}:{cart_hash}"
    return hashlib.sha256(raw_key.encode()).hexdigest()

# Gerçek ortamda bu anahtar .env dosyasından güvenle çekilmelidir.
# Şimdilik Test/Simülasyon anahtarı kullanılıyor veya env'den okunuyor.
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_SovereignMasterKey_Simulated")

class CheckoutRequest(BaseModel):
    agent_id: str
    product_id: str
    product_name: str
    price_eur: float # Örn: 145.00

class HesitationRequest(BaseModel):
    product_id: str
    original_price: float
    currency: str = "eur"

@router.post("/hesitation")
async def process_hesitation(data: HesitationRequest):
    """
    Kullanıcı belirli bir kartta (örn. Ottoman Apex) 7 sn'den fazla
    zaman geçirip tıkladığında FOMO indirimini tetikler.
    Frontend'e Reality Distortion yanıtı döner.
    """
    logger.info(f"🧠 [HESITATION DETECTED] VIP User focused on {data.product_id} ({data.original_price} {data.currency})")
    
    # Özel İndirim Hesabı (Örn: 20 Euro Düşüş)
    discount = 20.0
    new_price = max(data.original_price - discount, 0)
    
    return {
        "status": "reality_distorted",
        "product_id": data.product_id,
        "original_price": data.original_price,
        "new_price": new_price,
        "currency": data.currency,
        "message": "Sovereign Privilege Applied"
    }

@router.post("/generate_checkout")
async def generate_sovereign_checkout(data: CheckoutRequest, cart_hash: str = "v1"):
    """
    Phase 31: Sürtünmesiz (Frictionless) Tahsilat Motoru.
    Ürün bilgisini alır ve doğrudan Apple Pay / Google Pay destekli 
    bir Stripe Checkout URL'si üretir.
    """
    logger.info(f"💳 [STRIPE GATEWAY] Ajan {data.agent_id} için {data.product_name} tahsilat linki üretiliyor...")
    
    try:
        # 1. Deterministik anahtarı üret
        idem_key = generate_idempotency_key(data.agent_id, data.product_id, cart_hash)
        logger.info(f"💳 [STRIPE] Checkout başlatılıyor. Idempotency Key: {idem_key}")

        # 2. [İyi Uygulama] Session oluşturmadan hemen önce DB'ye "pending" kaydı açılmalıdır
        # await db.execute("INSERT INTO orders (user_id, product_id, status, idem_key) VALUES ($1, $2, 'pending', $3)", data.agent_id, data.product_id, idem_key)

        if stripe.api_key == "sk_test_SovereignMasterKey_Simulated" or not stripe.api_key:
             raise ValueError("Simulated Key in use")
             
        # Stripe Checkout Session Oluşturma (Tek kullanımlık, hızlı ödeme)
        session = stripe.checkout.Session.create(
            payment_method_types=['card'], # Apple/Google Pay automatically included in supported regions
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': data.product_name,
                    },
                    'unit_amount': int(data.price_eur * 100), # Stripe cent olarak çalışır
                },
                'quantity': 1,
            }],
            mode='payment',
            client_reference_id=data.agent_id,
            idempotency_key=idem_key, # <--- KRİTİK ZIRH BURASI
            # İşlem başarılı olursa Santis OS'a geri döner
            success_url=f"https://santis.club/checkout/success?session_id={{CHECKOUT_SESSION_ID}}&agent={data.agent_id}",
            cancel_url=f"https://santis.club/checkout/canceled?agent={data.agent_id}",
        )
        
        logger.info(f"✅ [STRIPE GATEWAY] Link hazır! {session.url}")
        
        return {
            "status": "CHECKOUT_READY",
            "checkout_url": session.url,
            "session_id": session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"🚨 [STRIPE ERROR] Checkout başarısız: {str(e)}")
        raise HTTPException(status_code=400, detail="Ödeme altyapısı şu an meşgul. Lütfen tekrar deneyin.")
    except Exception as e:
        logger.warning(f"⚠️ [STRIPE GATEWAY] Simülasyon Devrede: {str(e)}")
        # API anahtarı geçersizse veya bağlantı yoksa bile sistemi çökertmemek için
        # Sovereign Simülasyon Zırhı ile sahte bir link dönüyoruz.
        return {
            "status": "SIMULATED_CHECKOUT_READY",
            "checkout_url": f"https://checkout.stripe.com/pay/simulated_sovereign_{data.product_id}",
            "message": "Stripe API Key eksik/sahte, simülasyon linki üretildi."
        }

# Faz 32: Sovereign Webhook Dinleyicisi
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_SovereignSecretKey")

from app.api.v1.endpoints.media_gateway import dna_completed_queue
# Request was imported at the top file level now

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Sovereign Revenue Pulse (Kasanın Sesi).
    Stripe'tan gelen anlık ödeme bildirimlerini dinler ve Master'a fırlatır.
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature', '')

    try:
        # 1. Zırh Kontrolü: Gelen sinyal gerçekten Stripe'tan mı?
        # Simülasyon modu aktifse imza doğrulamasını atla (Test amaçlı)
        if stripe.api_key == "sk_test_SovereignMasterKey_Simulated" or endpoint_secret == "whsec_SovereignSecretKey":
            event = json.loads(payload)
            logger.warning("⚠️ [WEBHOOK] Sovereign Simülasyon Modu: Güvenlik Duvarı Bypass Edildi.")
        else:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
            
    except ValueError as e:
        logger.error(f"❌ [WEBHOOK ERROR] Geçersiz Payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.critical(f"🚨 [WEBHOOK HACK ATTEMPT] Geçersiz imza! {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.warning(f"⚠️ [WEBHOOK PARSE] Tanimsiz olay formatı: {e}")
        event = json.loads(payload) 

    # 2. STATE MACHINE İNFAZI & Yarış Durumu Koruması
    if event.get('type') == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session.get('id')
        
        # Checkout URL üretirken metadata/client_ref üzerinden gelen agent id
        agent_id = session.get('client_reference_id') or session.get('metadata', {}).get('agent_id', 'Agent_Unknown')
            
        amount_total = session.get('amount_total', 14500) / 100.0 # Cent'ten Euro'ya
        currency = session.get('currency', 'eur').upper()

        # [CRITICAL FIX]: Veritabanından mevcut durumu ÇEK VE KİLİTLE
        # Örnek: current_status = await db.fetch_val("SELECT status FROM orders WHERE session_id = $1", session_id)
        current_status = "pending" # Simülasyon
        
        # A. Eğer zaten işlendiyse, işlemi durdur ve Stripe'a 200 dön (Duplicate Webhook Koruması)
        if current_status in ["paid", "activated", "completed"]:
            logger.info(f"🔁 [STATE MACHINE] Ödeme {session_id} zaten '{current_status}' durumunda. Duplicate event atlanıyor.")
            return {"status": "already_processed"}

        # B. Durum pending ise, 'paid' olarak güncelle ve sistemi aktifleştir
        if current_status == "pending":
            logger.success(f"💰 [REVENUE STRIKE] {agent_id} için ödeme alındı. State PENDING -> PAID")
            # await db.execute("UPDATE orders SET status = 'paid' WHERE session_id = $1", session_id)
            
            # 3. Neural Broadcast: Altın Darbeyi (Pulse) SSE kuyruğuna fırlat
            strike_data = {
                "type": "PAYMENT_SUCCESS",
                "agent_id": agent_id,
                "amount": amount_total,
                "currency": currency,
                "message": f"Ajan {agent_id[0:8]} üzerinden +{amount_total} {currency} kasaya girdi."
            }
            
            # Asenkron kuyruğa ekle (/pulse endpoint'i tarafından dinleniyor)
            await dna_completed_queue.put(strike_data)

    # Stripe'a her zaman 200 dönmeliyiz, yoksa webhook'u saatlerce tekrar tekrar göndermeye çalışır.
    return {"status": "success"}
