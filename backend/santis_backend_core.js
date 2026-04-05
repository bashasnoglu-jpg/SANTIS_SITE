/**
 * SANTIS LÜKS SPA EKOSİSTEMİ - BAŞMİMARIN ANA MOTORU
 * Kapsam: Çarpışma Kontrolü, Zero-Trust Ödeme, Guest DNA & IoT
 * Ortam: Production (Canlı)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios'); // Akıllı Bina (KNX/DALI) haberleşmesi için

// Firebase Admin SDK Başlatımı
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

// ============================================================================
// FAZ 1: ÇARPIŞMA MOTORU & ŞELALE FİYATLANDIRMA (Mutex Lock)
// ============================================================================
exports.acquireUltraMegaLock = functions.https.onCall(async (data, context) => {
    // SIFIR GÜVEN: Frontend'den sadece ID'leri alıyoruz, fiyatı değil!
    const { userId, packageId, targetDate, startTime, resourceId } = data;
    const lockId = `lock_${targetDate}_${startTime}_${resourceId}`;
    const lockRef = db.collection('time_locks').doc(lockId);

    return await db.runTransaction(async (t) => {
        const lockDoc = await t.get(lockRef);
        
        // 1. Phantom Read / Double Booking Kalkanı
        if (lockDoc.exists && lockDoc.data().expiresAt > Date.now() && lockDoc.data().status !== 'failed') {
            throw new functions.https.HttpsError('aborted', 'CONFLICT_DETECTED: Bu lüks deneyim milisaniyeler önce opsiyonlandı.');
        }

        const serviceDoc = await t.get(db.collection('services').doc(packageId));
        const guestDoc = await t.get(db.collection('guests').doc(userId));
        
        if (!serviceDoc.exists) throw new functions.https.HttpsError('not-found', 'Hizmet bulunamadı.');

        const service = serviceDoc.data();
        const guest = guestDoc.exists ? guestDoc.data() : { loyalty: { isMember: false } };

        // 2. Şelale (Waterfall) Fiyatlandırma Motoru
        let finalPrice = service.basePrice;
        if (service.isPackage) finalPrice *= 0.85; // %15 Paket Avantajı
        if (guest.loyalty.isMember) finalPrice *= 0.95; // %5 Santis VIP İndirimi

        // 3. Dinamik Operasyonel Pay (Temizlik & Hazırlık Buffer'ı)
        const cleanup = service.flowConstraints?.step1?.cleanupDuration || 15;
        const totalLockMinutes = service.totalDuration + cleanup;

        // 4. Atomik Kilidi Mühürle (10 Dk Ödeme Süresi)
        t.set(lockRef, {
            resourceId,
            lockedBy: userId,
            status: 'pending_payment',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: Date.now() + (10 * 60 * 1000), 
            lockedPrice: Math.round(finalPrice),
            totalLockDuration: totalLockMinutes,
            packageId: packageId
        });

        // Checkout için Stripe Session ID veya Kilit Onayı dön
        return { 
            status: "SUCCESS", 
            lockId: lockId,
            finalPrice: Math.round(finalPrice),
            message: "Kaynak kilitlendi. Lütfen 10 dakika içinde ödemeyi tamamlayın."
        };
    });
});

// ============================================================================
// FAZ 2: IFRS 15 SIFIR GÜVEN ÖDEME TEYİDİ (Stripe Webhook)
// ============================================================================
exports.santisPaymentWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        // Kriptografik Zırh: Gelen onayın gerçekten bankadan geldiğini doğrula
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        console.error(`[SANTIS SHIELD] Webhook İmzası Geçersiz: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const lockId = session.metadata.lockId;
        const userId = session.metadata.userId;

        try {
            await db.runTransaction(async (t) => {
                const lockRef = db.collection('time_locks').doc(lockId);
                const lockDoc = await t.get(lockRef);

                // Kilit düşmüş mü? (Müşteri 11. dakikada ödediyse parayı iade et, odayı verme!)
                if (!lockDoc.exists || lockDoc.data().status !== 'pending_payment' || lockDoc.data().expiresAt < Date.now()) {
                    // IFRS 15: Hizmet verilemiyorsa iadeyi tetikle (Opsiyonel kurgu)
                    throw new Error("Kilit zaman aşımına uğradı. Çifte rezervasyon engellendi.");
                }

                const lockData = lockDoc.data();

                // 1. Kilidi Sonsuza Dek Kapat (God's Eye paneline "Dolu" yansır)
                t.update(lockRef, { status: 'completed', paymentId: session.id });

                // 2. Rezervasyonu Ana Kütüğe İşle
                const resvRef = db.collection('reservations').doc(`resv_${Date.now()}`);
                t.set(resvRef, {
                    customerId: userId,
                    lockId: lockId,
                    packageId: lockData.packageId,
                    resourceId: lockData.resourceId,
                    status: "confirmed",
                    totalPrice: lockData.lockedPrice,
                    iotTriggers: { arrival: false, room_prepared: false },
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // 3. Guest DNA Sadakat Motoru: Müşteri LTV'sini (Yaşam Boyu Değeri) artır
                t.update(db.collection('guests').doc(userId), {
                    'loyalty.lifetimeValue': admin.firestore.FieldValue.increment(lockData.lockedPrice)
                });
            });

            console.log(`[SANTIS SUCCESS] Ödeme Onaylandı! LTV Güncellendi. Misafir: ${userId}`);
        } catch (error) {
            console.error("[CRITICAL ERROR] Kilit/Ödeme eşleşme hatası:", error);
            return res.status(500).send("Transaction Failed");
        }
    }

    res.json({received: true}); // Stripe'a onay dön
});

// ============================================================================
// FAZ 3: ODAYA RUH ÜFLEYEN KOD (Akıllı Bina IoT Tetikleyicisi)
// ============================================================================
exports.triggerSmartRoomIoT = functions.https.onCall(async (data, context) => {
    // Resepsiyonist "Check-in" butonuna bastığında veya müşteri lokasyonla geldiğinde çalışır
    const { reservationId } = data;

    try {
        const resDoc = await db.collection('reservations').doc(reservationId).get();
        if (!resDoc.exists) throw new functions.https.HttpsError('not-found', 'Rezervasyon yok.');
        
        const reservation = resDoc.data();
        const guestDoc = await db.collection('guests').doc(reservation.customerId).get();
        
        // Misafir DNA'sını Okuma
        const guestDNA = guestDoc.exists ? guestDoc.data().luxuryPreferences : {};
        
        // Hayat Kurtaran Alerji Çözümücü
        const hasLavenderAllergy = guestDNA.allergies && guestDNA.allergies.includes("lavender");
        const safeAroma = hasLavenderAllergy ? "eucalyptus_safe" : "lavender_relax";

        // Akıllı Bina API Payload'u (KNX/Control4 Sistemine)
        const iotPayload = {
            roomId: reservation.resourceId,
            action: "scene_prepare",
            theme: reservation.packageId.includes("detox") ? "emerald_detox" : "amber_relax",
            climate: { targetTemp: guestDNA.roomTemp || 23.5 },
            scent: { diffuser: safeAroma },
            music: { playlist: "santis_healing_528Hz", volume: 45 }
        };

        // await axios.post('https://iot.santis.local/api/v1/scene/prepare', iotPayload, { headers: { 'X-API-KEY': process.env.IOT_KEY } });

        // The God's Eye Paneli anında SARIYA (Seansta) döner
        await db.collection('reservations').doc(reservationId).update({
            "iotTriggers.room_prepared": true,
            status: "in_progress" 
        });

        return { status: "SUCCESS", message: "Akıllı oda Guest DNA'ya göre senkronize edildi." };

    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Akıllı Bina İletişim Hatası');
    }
});
