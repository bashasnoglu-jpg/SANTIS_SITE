/**
 * SANTIS OS - PHASE 15: STRIPE PAYMENT GATEWAY
 * Architecture: Server-Side Payment Intents & JWT Verification
 */
const express = require('express');
const stripe = require('stripe')(process.env.SANTIS_STRIPE_SECRET_KEY);
const SecurityEngine = require('./santis-security'); // Phase 14 Modülü
const router = express.Router();

router.post('/api/checkout/intent', SecurityEngine.idempotencyGuard, async (req, res) => {
    const { token, signature } = req.body;

    if (!token || !signature) {
        return res.status(400).json({ error: 'Kriptografik mühür eksik.' });
    }

    // 1. JWT ve HMAC Doğrulaması (Sıfır Güven)
    const decodedPayload = SecurityEngine.verifyCheckoutPayload(token, signature);
    
    if (!decodedPayload) {
        return res.status(403).json({ error: 'Güvenlik ihlali tespit edildi. İşlem durduruldu.' });
    }

    try {
        // 2. Stripe Payment Intent Oluşturma
        // Stripe tutarları her zaman en küçük para birimi (kuruş/cent) cinsinden bekler
        const amountInKurus = Math.round(decodedPayload.total * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInKurus,
            currency: decodedPayload.currency.toLowerCase(),
            // Apple Pay ve Google Pay dahil tüm modern yöntemleri otomatik sunar
            automatic_payment_methods: { enabled: true }, 
            metadata: {
                sessionId: decodedPayload.session,
                discountCode: decodedPayload.discountCode || 'NONE'
            }
        });

        // 3. Frontend'e sadece güvenli çizim anahtarını dön
        res.json({ clientSecret: paymentIntent.client_secret });

    } catch (error) {
        console.error('🦅 [Stripe Error]:', error.message);
        res.status(500).json({ error: 'Ödeme geçidi ile iletişim kurulamadı.' });
    }
});

module.exports = router;
