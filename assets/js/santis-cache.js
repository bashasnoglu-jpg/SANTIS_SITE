/**
 * ========================================================================
 * SOVEREIGN OS v10 - LAYER 9: SURGICAL MEMORY CACHE
 * ========================================================================
 * Architecture: O(1) Delta Patching, Zero-Fetch SPA Navigation
 */

// Global Singleton (Sayfa değişse de RAM'de kalır)
window.__SANTIS_DATA_CACHE__ = window.__SANTIS_DATA_CACHE__ || {};

export const SantisCache = {
    // 1. GET: Motor veri istediğinde anında (0ms) verir
    get(category) {
        return window.__SANTIS_DATA_CACHE__[category]?.data || null;
    },

    // 2. SET: İlk fetch işleminden sonra veriyi RAM'e kilitler
    set(category, data) {
        window.__SANTIS_DATA_CACHE__[category] = {
            timestamp: Date.now(),
            data: data // Aegis'ten geçen Object.freeze mühürlü veri
        };
    },

    // 3. SURGICAL PATCH: Tüm Cache'i silmeden sadece 1 node'u günceller!
    surgicalPatch(action, payload) {
        // Kategori belirtilmemişse tüm önbelleklerde o ID'yi ara
        const categories = payload.category
            ? [payload.category]
            : Object.keys(window.__SANTIS_DATA_CACHE__);

        categories.forEach(cat => {
            const cacheObj = window.__SANTIS_DATA_CACHE__[cat];
            if (!cacheObj || !cacheObj.data) return;

            // Array'in referansını kırarak sığ kopya al (Mutasyon güvenliği)
            let dataArray = [...cacheObj.data];
            let isMutated = false;

            if (action === 'UPDATE') {
                const idx = dataArray.findIndex(i => i.id === payload.id);
                if (idx > -1) {
                    dataArray[idx] = payload; // Yeni mühürlü veriyi eski sıraya koy
                    isMutated = true;
                }
            } else if (action === 'PATCH_PRICE') {
                const idx = dataArray.findIndex(i => i.id === payload.id);
                if (idx > -1) {
                    // Sadece price değerlerini güncelle, geri kalan veriyi elleme
                    dataArray[idx] = { ...dataArray[idx], price: payload.price_eur, price_eur: payload.price_eur, current_price_eur: payload.price_eur };
                    isMutated = true;
                }
            } else if (action === 'DELETE') {
                const initialLen = dataArray.length;
                dataArray = dataArray.filter(i => i.id !== payload.id);
                if (dataArray.length !== initialLen) isMutated = true;
            } else if (action === 'ADD') {
                // Eğer kategori eşleşiyorsa veya kategori yoksa (genel havuz) ekle
                if (payload.category === cat || !payload.category) {
                    // Çift ekleme koruması
                    if (!dataArray.find(i => i.id === payload.id)) {
                        dataArray.push(payload);
                        dataArray.sort((a, b) => a.order - b.order); // Sıralamayı koru
                        isMutated = true;
                    }
                }
            }

            // Eğer bir değişiklik olduysa Cache'i sessizce güncelle
            if (isMutated) {
                window.__SANTIS_DATA_CACHE__[cat].data = dataArray;
                window.__SANTIS_DATA_CACHE__[cat].timestamp = Date.now();
                console.log(`🧠 [SantisCache] Cerrahi yama: ${action} → ${payload.id || payload}`);
            }
        });
    }
};

// Global erişim (ES Module import yapamayan eski dosyalar için)
window.SantisCache = SantisCache;
