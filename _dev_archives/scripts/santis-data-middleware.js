/**
 * ============================================================================
 * SOVEREIGN OS v10.1 - LAYER 2: SANTIS DATA AEGIS (QUANTUM MIDDLEWARE)
 * ============================================================================
 * Architecture : Immutable, Crash-Free, Polymorphic, Zero-GC Ready
 * Performance  : O(n) normalization, Object.freeze mühürü
 * Kural        : Bu dosya ASLA doğrudan veri yazmaz. Sadece okur ve dönüştürür.
 *
 * ⚠️  KRİTİK: ID'ler deterministiktir. crypto.randomUUID() YASAK.
 *     Rastgele ID → Pool DOM Diffing çöker → 0-GC hedefi yok olur.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 🗺️  CATEGORY_IMAGE_MAP — 32 Boş Görsel Slotunu Runtime'da Doldurur
//     JSON dosyalarına dokunmadan her servise kendi görseli atanır.
//     Anahtar: raw.id değeri | Değer: /assets/img/cards/ altındaki dosya adı
// ---------------------------------------------------------------------------
const CATEGORY_IMAGE_MAP = {
    // massages.json — Asya Ritüelleri
    'msg_thai_01': 'santis_card_thai_lux.webp',
    'msg_thai_full_1a': 'santis_card_thai_v1.webp',
    'msg_thai_aroma_1b': 'santis_card_massage_oil_v2.webp',
    'msg_bali_02': 'santis_card_couple_v1.webp',
    'msg_bali_full_2a': 'santis_card_deep_relax_v2.webp',
    'msg_bali_aroma_2b': 'santis_card_massage_oil_v2.webp',
    'msg_shiatsu_03': 'santis_card_massage_lux.webp',
    'msg_reflex_04': 'santis_card_reflexology_v1.webp',
    'msg_thai_herb_05': 'santis_card_deeptissue_lux.webp',
    'msg_lomi_06': 'santis_card_shirodhara_v1.webp',

    // massages.json — Klasik & Medikal
    'msg_swedish_05': 'santis_card_massage_v1.webp',
    'msg_deep_06': 'santis_card_deeptissue_lux.webp',
    'msg_lymph_07': 'santis_card_detox_brush_v2.webp',
    'msg_aroma_08': 'santis_card_massage_oil_v2.webp',
    'msg_stone_09': 'santis_card_deep_relax_v2.webp',
    'msg_head_10': 'santis_card_massage_v1.webp',
    'msg_trigger_11': 'santis_card_recovery_lotion_v2.webp',
    'msg_sports_12': 'santis_card_deeptissue_v1.webp',

    // massages.json — Signature & Çift
    'msg_sig_13': 'santis_card_massage_lux.webp',
    'msg_couple_14': 'santis_card_couple_v1.webp',
    'msg_couple_15': 'santis_card_thai_lux.webp',
    'msg_anti_stress_16': 'santis_card_recovery_lotion_v2.webp',
    'msg_mom_kid_17': 'santis_card_kids_v1.webp',
    'msg_cellulite_18': 'santis_card_detox_brush_v2.webp',

    // hammam_tr.json — 8 slot (id alanı yoksa slug bazlı)
    'hamam-geleneksel': 'santis_card_hammam_v1.webp',
    'hamam-sultan': 'santis_card_hammam_lux.webp',
    'hamam-kopuk': 'santis_card_foam_lux.webp',
    'hamam-kahve': 'santis_card_hamam_scrub_v2.webp',
    'hamam-kese': 'santis_card_hamam_kese_v2.webp',
    'hamam-detoks': 'santis_card_detox_brush_v2.webp',
    'hamam-bal': 'santis_card_hamam_kese_v2.webp',
    'hamam-cikolata': 'santis_card_foam_v1.webp',
};

// ---------------------------------------------------------------------------
// 🎨  CATEGORY FALLBACK MAP — ID eşleşmesi yoksa kategori bazlı son çare
// ---------------------------------------------------------------------------
const CATEGORY_FALLBACK_MAP = {
    'asian': 'santis_card_deep_relax_v2.webp',
    'classical': 'santis_card_massage_oil_v2.webp',
    'specialty': 'santis_card_massage_lux.webp',
    'hammam': 'santis_card_hammam_v1.webp',
    'hamam': 'santis_card_hamam_kese_v2.webp',
    'skincare': 'santis_card_skincare_lux.webp',
    'sothys': 'santis_card_skincare_clay_v2.webp',
    'wellness': 'santis_card_shirodhara_v1.webp',
    'ritual': 'santis_card_massage_lux.webp',
};

// ---------------------------------------------------------------------------
// ✅  SantisDataAegis — Tüm Normalizasyon Mantığı
// ---------------------------------------------------------------------------
export class SantisDataAegis {

    // -----------------------------------------------------------------------
    // 1. CRASH-FREE TITLE EXTRACTOR
    //    Optional Chaining (?.) + Short-Circuit (||) ile undefined.split YASAK
    // -----------------------------------------------------------------------
    static extractTitle(raw) {
        let safeTitle = raw?.title
            || raw?.name
            || raw?.content?.tr?.title
            || raw?.content?.title
            || 'Sovereign Ritüel';

        // XSS Zırhı: Admin'den HTML/Script sızmaz
        safeTitle = String(safeTitle).replace(/(<([^>]+)>)/gi, '').trim();

        // UI sınırı: 120 karakteri aşarsa kırp
        return safeTitle.length > 120 ? safeTitle.substring(0, 117) + '...' : safeTitle;
    }

    // -----------------------------------------------------------------------
    // 2. DETERMINISTIC SLUG GENERATOR
    //    DOM Diffing'in temeli. Aynı girdi → Aynı çıktı. Her zaman.
    // -----------------------------------------------------------------------
    static generateSlug(title, index = 0) {
        const base = String(title).toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, ''); // Baş/son tire temizle

        return index > 0 ? `${base}-${index}` : base;
    }

    // -----------------------------------------------------------------------
    // 3. FINANCIAL PARSER — Nullish Coalescing (??)
    //    ?? operatörü: 0 (Ücretsiz/Kampanya) değerini korur. || bunu false sayardı.
    // -----------------------------------------------------------------------
    static parsePrice(raw) {
        // ?? sadece null/undefined'da fallback'e geçer, 0'ı aslanlar gibi korur
        let rawPrice = raw?.price_eur
            ?? raw?.price?.amount
            ?? raw?.price
            ?? raw?.cost
            ?? 0;

        const cleanPrice = typeof rawPrice === 'string'
            ? parseFloat(rawPrice.replace(/[^0-9.-]+/g, ''))
            : Number(rawPrice);

        return (isNaN(cleanPrice) || cleanPrice < 0) ? 0 : cleanPrice;
    }

    // -----------------------------------------------------------------------
    // 4. SMART DURATION PARSER
    //    "1h" → "60 Min" | 90 (int) → "90 Min" | "50 min" → "50 Min"
    // -----------------------------------------------------------------------
    static parseDuration(raw) {
        const val = raw?.duration ?? raw?.duration_min;
        if (!val) return '60 Min';

        const str = String(val).toLowerCase().trim();

        if (str.includes('h')) {
            const hours = parseFloat(str);
            return !isNaN(hours) ? `${Math.round(hours * 60)} Min` : '60 Min';
        }

        const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
        return (!isNaN(num) && num > 0) ? `${num} Min` : '60 Min';
    }

    // -----------------------------------------------------------------------
    // 5. SMART IMAGE RESOLVER
    //    Öncelik: JSON görseli → CATEGORY_IMAGE_MAP[id] → CATEGORY_FALLBACK_MAP
    //    V5 engine'deki mevcut FALLBACK_MAP ile koordineli çalışır.
    // -----------------------------------------------------------------------
    static resolveImage(raw, id, category = '') {
        // Öncelik 1: JSON'dan gelen temiz, benzersiz görsel
        const rawImg = raw?.image || raw?.image_url || raw?.media?.hero || raw?.media?.card || raw?.img;
        if (rawImg && rawImg.trim() !== '') {
            // Sadece dosya adıysa tam yol ekle
            if (!rawImg.startsWith('http') && !rawImg.startsWith('/assets/')) {
                return `/assets/img/cards/${rawImg}`;
            }
            return rawImg;
        }

        // Öncelik 2: ID bazlı runtime haritası (32 boş slotu kapatır)
        if (id && CATEGORY_IMAGE_MAP[id]) {
            return `/assets/img/cards/${CATEGORY_IMAGE_MAP[id]}`;
        }

        // Öncelik 3: Slug bazlı arama (hammam_tr.json için)
        const slugKey = raw?.slug || this.generateSlug(raw?.title || '');
        if (slugKey && CATEGORY_IMAGE_MAP[slugKey]) {
            return `/assets/img/cards/${CATEGORY_IMAGE_MAP[slugKey]}`;
        }

        // Öncelik 4: Kategori bazlı son çare
        const cat = String(category).toLowerCase();
        const catKey = Object.keys(CATEGORY_FALLBACK_MAP).find(k => cat.includes(k));
        if (catKey) {
            return `/assets/img/cards/${CATEGORY_FALLBACK_MAP[catKey]}`;
        }

        // Mutlak fallback
        return '/assets/img/cards/santis_card_massage_lux.webp';
    }

    // -----------------------------------------------------------------------
    // 6. SMART URL RESOLVER (ROUTING ZIRHI)
    //    Asian, Sothys-Antiage gibi backend taglarını gerçek dosya yollarına çevirir
    // -----------------------------------------------------------------------
    static resolveFolder(category) {
        const cat = String(category).toLowerCase();
        if (cat.includes('sothys') || cat.includes('skincare') || cat.includes('cilt')) return 'cilt-bakimi';
        if (cat.includes('asian') || cat.includes('classical') || cat.includes('massage') || cat.includes('masaj') || cat.includes('specialty')) return 'masajlar';
        if (cat.includes('hamam') || cat.includes('hammam')) return 'hamam';
        if (cat.includes('signature') || cat.includes('ritual') || cat.includes('journey')) return 'rituals';
        return category; // fallback (eşleşme yoksa kendi değerini dönsün)
    }

    // -----------------------------------------------------------------------
    // 7. MASTER CONTRACT NORMALIZER (V10 Şeması)
    //    Girdi: Herhangi bir ham JSON kaydı
    //    Çıktı: Object.freeze() ile mühürlenmiş 13 alanlı standart nesne
    // -----------------------------------------------------------------------
    static normalizeService(raw, index = 0, fallbackCategory = 'ritual') {
        if (!raw || typeof raw !== 'object') return null;

        // Zombi Kart Koruması: Silinmiş veya pasif kayıtlar DOM'a girmez
        if (raw.status === 'deleted' || raw.status === 'inactive') return null;

        const type = raw.type || 'service';

        // Polimorfik Blok: spacer/banner tipi validasyonu bypass eder
        if (type !== 'service') {
            return Object.freeze({
                id: raw.id || `sts-block-${index}`,
                type: type,
                ...raw
            });
        }

        const safeTitle = this.extractTitle(raw);
        const slug = raw.slug || this.generateSlug(safeTitle, index);

        // ⚠️  DETERMİNİSTİK ID — randomUUID() YASAK
        const id = String(raw.id ?? `sts-${slug}`);
        const category = String(raw.category || raw.categoryId || raw.tier || fallbackCategory);
        const isSig = Boolean(
            raw.is_signature
            || raw.signature
            || raw.badges?.includes('Signature')
        );

        const normalized = {
            id: id,
            type: 'service',
            slug: slug,
            category: category,
            title: safeTitle,
            price_eur: this.parsePrice(raw),
            duration: this.parseDuration(raw),
            image: this.resolveImage(raw, id, category),
            url: (raw.url && raw.url !== 'undefined') ? raw.url :
                (raw.detailUrl && raw.detailUrl !== 'undefined') ? raw.detailUrl :
                    (category && slug && slug !== 'undefined' && category !== 'undefined') ? `/tr/${this.resolveFolder(category)}/${slug}.html` : 'javascript:void(0)',
            is_signature: isSig,
            aura: raw.aura || (isSig ? 'santis-gold' : 'silver-glow'),
            status: raw.status || 'active',
            order: Number(raw.order) || (index + 1),
            badge: raw.badge
                || raw.badges?.[0]
                || (isSig ? 'SOVEREIGN APEX' : 'RECOVERY LAB'),
        };

        // 💎 IMMUTABLE MÜHÜR
        // Motor bu nesneyi sadece okuyabilir, yazamaz.
        // Havuz Zehirlenmesi (Pool Poisoning) %100 engellenir.
        return Object.freeze(normalized);
    }

    // -----------------------------------------------------------------------
    // 7. PIPELINE EXECUTOR — Tüm diziyi yıkar, sıralar, süzer
    // -----------------------------------------------------------------------
    static processPipeline(rawDataArray, fallbackCategory = 'ritual') {
        if (!Array.isArray(rawDataArray)) return [];

        return rawDataArray
            .map((item, index) => this.normalizeService(item, index, fallbackCategory))
            .filter(Boolean)                        // null/undefined → çöp
            .sort((a, b) => a.order - b.order);    // order alanına göre sırala
    }
}

// ---------------------------------------------------------------------------
// Global erişim (window) — ES Module import yapamayan eski dosyalar için
// ---------------------------------------------------------------------------
window.SantisDataAegis = SantisDataAegis;
