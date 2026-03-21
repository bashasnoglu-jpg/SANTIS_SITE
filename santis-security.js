/**
 * SANTIS OS - PHASE 14: SECURITY ENGINE
 * Features: JWT Cart Sealing, HMAC Signatures, Idempotency Locks
 */
const jwt = require('jsonwebtoken'); // You will need to install jsonwebtoken
const crypto = require('crypto');

// Çevresel Değişkenler (Kesinlikle .env içinde tutulmalı)
const JWT_SECRET = process.env.SANTIS_JWT_SECRET || 'santis_super_secret_master_key_2026';
const HMAC_SECRET = process.env.SANTIS_HMAC_SECRET || 'santis_hmac_vault_key';

// Bellek İçi Idempotency Havuzu (Production'da Redis kullanılır)
const idempotencyCache = new Set();

const SecurityEngine = {
  // 1. JWT İLE SEPETİ MÜHÜRLE
  // Fiyat hesaplaması sadece sunucuda yapılır, frontend sadece gösterir.
  sealCart: (sessionId, subtotal, discountCode, discountRate) => {
    const total = subtotal - (subtotal * discountRate);
    
    const payload = {
      session: sessionId,
      subtotal,
      discountCode,
      total,
      currency: 'TRY'
    };

    // Token 15 dakika içinde kendini imha eder (FOMO ile senkronize)
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    
    // Ayrıca verinin bütünlüğünü kanıtlamak için HMAC SHA-256 imzası
    const signature = crypto.createHmac('sha256', HMAC_SECRET)
                            .update(token)
                            .digest('hex');

    return { token, signature, total };
  },

  // 2. IDEMPOTENCY (ÇİFT ÇEKİM KORUMASI) MIDDLEWARE
  // Kullanıcı "Öde" butonuna panikle 5 kere bassa bile sadece 1 kez işlem yapılır.
  idempotencyGuard: (req, res, next) => {
    const idempotencyKey = req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
        return res.status(400).json({ error: 'Idempotency Key eksik. İşlem reddedildi.' });
    }

    if (idempotencyCache.has(idempotencyKey)) {
        console.warn(`🛡️ [Santis Security] Çift çekim (Double-Charge) engellendi. Key: ${idempotencyKey}`);
        // 409 Conflict veya önceki başarılı yanıtın aynısı dönülür
        return res.status(409).json({ message: 'Bu işlem zaten gerçekleştiriliyor.' });
    }

    // Anahtarı kilitle (1 saat sonra bellekten sil)
    idempotencyCache.add(idempotencyKey);
    setTimeout(() => idempotencyCache.delete(idempotencyKey), 3600000);

    next();
  },

  // 3. ÖDEME ÖNCESİ PAYLOAD DOĞRULAMA
  verifyCheckoutPayload: (token, signature) => {
    try {
        // 1. İmza (HMAC) kontrolü - Token yolda değiştirilmiş mi?
        const expectedSignature = crypto.createHmac('sha256', HMAC_SECRET)
                                        .update(token)
                                        .digest('hex');
        
        if (expectedSignature !== signature) {
            throw new Error('HMAC İmza Uyuşmazlığı. Manipülasyon Tespit Edildi!');
        }

        // 2. JWT Decode ve Süre (Expiration) kontrolü
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        console.error(`🚨 [Santis Panic] Güvenlik İhlali: ${err.message}`);
        return null;
    }
  }
};

module.exports = SecurityEngine;
