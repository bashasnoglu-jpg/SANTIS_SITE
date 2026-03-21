/**
 * SANTIS OS - WALLET ROUTER
 * Apple Wallet'a indirme ve kayıt isteklerini yönetir.
 */
const express = require('express');
const WalletEngine = require('./santis-wallet-generator');
const router = express.Router();

router.get('/api/pass/apple/generate', async (req, res) => {
    // Session ID'yi doğrula (Middleware ile yapılabilir)
    const sessionId = req.query.session || req.cookies.santis_session;

    if (!sessionId) {
        return res.status(403).send('Geçersiz rezervasyon kimliği.');
    }

    try {
        // Gerçek senaryoda veritabanından müşterinin son rezervasyonunu çekeceksin
        const mockReservation = {
            sessionId: sessionId,
            serviceName: 'Santis Signature Massage',
            dateFormatted: 'Bugün, 19:30',
            isoDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 saat sonra
            roomCode: 'GOLD-07',
            walletAuthToken: crypto.randomBytes(16).toString('hex')
        };

        const pkpassBuffer = await WalletEngine.generateApplePass(mockReservation);

        // Apple cihazının dosyayı Cüzdan formatı olarak tanıması için gereken Headers
        res.set({
            'Content-Type': 'application/vnd.apple.pkpass',
            'Content-Disposition': `attachment; filename="santis-vip-${sessionId}.pkpass"`
        });

        // Buffer'ı doğrudan istemciye akıt
        res.send(pkpassBuffer);

    } catch (error) {
        res.status(500).json({ error: 'Cüzdan entegrasyonu şu an kullanılamıyor.' });
    }
});

// SANTIS OS - APPLE WALLET WEB SERVICE
// 1. Cihaz Kaydı (Müşteri bileti cüzdana eklediğinde Apple arka planda bu rotaya POST atar)
router.post('/v1/apple-wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', (req, res) => {
    const pushToken = req.body.pushToken;
    const serialNumber = req.params.serialNumber; // Bizim Session ID'miz
    
    // pushToken'ı veritabanına bu müşterinin kaydına ekle.
    // DB.savePushToken(serialNumber, pushToken);
    
    console.log(`🦅 [Santis APNs] Cihaz cüzdan ağına eklendi. Token: ${pushToken}`);
    res.status(201).end();
});

module.exports = router;
