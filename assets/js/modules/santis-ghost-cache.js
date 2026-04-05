/**
 * 👻 [SANTIS GHOST CACHE] - Phase J: Dynamic Route & State Persistence
 * Vizyon: "Geri" tuşu, bir zaman makinesi kadar hızlı olmalı.
 */

const GhostCache = (() => {
    const CACHE_NAME = 'santis-sovereign-v10';
    const MEMORY_RELAY = new Map(); // RAM üzerindeki hızlı erişim katmanı

    const isCacheable = (url) => {
        const excluded = ['/api/', '/admin', '/login'];
        // Ensure strictly frontend routing passes cache
        return !excluded.some(path => url.includes(path));
    };

    return {
        // Sayfayı Hayalet Belleğe Al
        seal: async (url, htmlContent) => {
            if (!isCacheable(url)) return;

            // 1. Katman: RAM (Ultra Hızlı)
            MEMORY_RELAY.set(url, {
                html: htmlContent,
                timestamp: Date.now(),
                scroll: window.scrollY || document.documentElement.scrollTop
            });

            // 2. Katman: CacheStorage (Kalıcı - Sayfa yenilense de gitmez)
            try {
                if ('caches' in window) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(url, new Response(htmlContent, {
                        headers: { 'Content-Type': 'text/html', 'X-Santis-Cache': 'True' }
                    }));
                }
            } catch (e) {
                console.warn('[Ghost Cache] Disk cache yazılamadı.', e);
            }

            console.log(`👻 [Ghost Cache] Rota mühürlendi: ${url}`);
        },

        // Bellekten Sayfayı Çağır
        summon: async (url) => {
            // Önce RAM'e bak
            if (MEMORY_RELAY.has(url)) {
                console.log(`⚡ [Ghost Cache] RAM üzerinden çağrıldı: ${url}`);
                return MEMORY_RELAY.get(url);
            }

            // Yoksa Disk Cache'e bak
            try {
                if ('caches' in window) {
                    const cache = await caches.open(CACHE_NAME);
                    const response = await cache.match(url);
                    if (response) {
                        const html = await response.text();
                        console.log(`💾 [Ghost Cache] Disk üzerinden çağrıldı: ${url}`);
                        return { html, scroll: 0 };
                    }
                }
            } catch (e) {
                console.warn('[Ghost Cache] Disk okuması başarısız.', e);
            }

            return null; // Ruh bulunamadı...
        },

        invalidate: (url) => {
            MEMORY_RELAY.delete(url);
            console.log(`🧹 [Ghost Cache] Bellek temizlendi: ${url}`);
        }
    };
})();

export default GhostCache;
