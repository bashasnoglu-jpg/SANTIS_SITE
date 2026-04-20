/**
 * SANTIS OS - PHASE 16: ZERO-TRUST WEBHOOKS
 * Architecture: Raw Body Parsing, Cryptographic Signature Verification
 */
const express = require('express');
const stripe = require('stripe')(process.env.SANTIS_STRIPE_SECRET_KEY);
const endpointSecret = process.env.SANTIS_STRIPE_WEBHOOK_SECRET; // Stripe Dashboard'dan alınır
const router = express.Router();

// DİKKAT: Webhook rotası 'express.json()' yerine 'express.raw()' KULLANMAK ZORUNDADIR!
// İmza doğrulaması bayt-bayt (byte-to-byte) eşleşme gerektirir.
router.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        // 1. STRIPE İMZASINI DOĞRULA (Sıfır-Güven Kalkanı)
        // Eğer payload yolda değiştirilmişse veya sahte bir sunucudan geliyorsa burada patlar.
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
        console.error(`🚨 [Santis Vault Panic] Webhook İmza Hatası: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 2. KESİN VE KANITLANMIŞ OLAYLARI İŞLE
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            handleSuccessfulPayment(paymentIntent);
            break;
            
        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object;
            handleFailedPayment(failedIntent);
            break;
            
        // Gerekirse abonelikler (subscriptions) veya iadeler (refunds) buraya eklenebilir
        default:
            console.log(`ℹ️ [Santis Vault] Göz ardı edilen olay tipi: ${event.type}`);
    }

    // 3. STRIPE'A "ALDIM" BİLDİRİMİ (Aksi takdirde Stripe 3 gün boyunca tekrar dener)
    res.status(200).json({ received: true });
});

// 📌 KESİN SATIŞ İNFAZ FONKSİYONU
function handleSuccessfulPayment(paymentIntent) {
    const amountTRY = (paymentIntent.amount / 100).toFixed(2);
    const { sessionId, discountCode } = paymentIntent.metadata; // Phase 15'te içine gömdüğümüz istihbarat

    console.log(`\n💰 [KASA ONAYI: BAŞARILI TAHSİLAT] ====================`);
    console.log(`👤 Müşteri: ${sessionId}`);
    console.log(`💳 Tutar: ${amountTRY} TRY`);
    console.log(`🎫 Kullanılan Ayrıcalık: ${discountCode}`);
    console.log(`====================================================\n`);

    // VERİTABANINA YAZMA İŞLEMİ BURADA YAPILIR (Örn: Order.create({...}))

    // GOD'S EYE V8 SOKETİNE "ZAFER" SİNYALİ FIRLAT
    // (santis-server.js içerisindeki wss.clients'a erişim sağladığınızı varsayarak)
    if (global.adminClients) {
        const payload = JSON.stringify({
            type: 'PAYMENT_CONFIRMED',
            data: { sessionId, amount: amountTRY, discountCode }
        });
        
        global.adminClients.forEach(client => {
            if (client.readyState === 1 /* WebSocket.OPEN */) {
                client.send(payload);
            }
        });
    }
}

function handleFailedPayment(paymentIntent) {
    console.warn(`⚠️ [KASA REDDİ] Tahsilat başarısız. Neden: ${paymentIntent.last_payment_error?.message}`);
    // God's Eye paneline 'PAYMENT_FAILED' sinyali fırlatılabilir.
}

module.exports = router;
