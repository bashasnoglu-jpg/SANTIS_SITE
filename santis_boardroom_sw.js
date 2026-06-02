/**
 * ⚡ SANTIS SOVEREIGN BOARDROOM - MICRO-FRONTEND SERVICE WORKER
 * Boka Biyosferi: Çevrimdışı (Offline) Dayanıklılık ve Webpack MFE Önbellekleme
 */

const BOARDROOM_VERSION = 'v11.2.7';
const MFE_CACHE_NAME = `sovereign_mfe_cache_${BOARDROOM_VERSION}`;
const API_CACHE_NAME = `sovereign_api_cache_${BOARDROOM_VERSION}`;

// ⚡ 1. MFE Cache Versioning: Kabusu Bitiren İsimlendirme Formatı
const getMfeCacheKey = (moduleName, version) => `${moduleName}@${version}`;

const CORE_ASSETS = [
    '/admin',
    '/assets/js/modules/santis-boardroom-mfe.js',
    '/assets/css/santis-boardroom.css'
];

self.addEventListener('install', (event) => {
    console.log(`[SW] Sovereign Boardroom Biyosferi Yükleniyor... (${BOARDROOM_VERSION})`);
    self.skipWaiting(); // Eski SW'yi anında öldür, yeniyi tak

    event.waitUntil(
        caches.open(MFE_CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log(`[SW] Sovereign Biyosferi Aktif: ${BOARDROOM_VERSION}`);
    // Eski versiyon önbellekleri imha et (Taktiksel Çöp Toplama)
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    const isSovereignOSCache = cacheName.startsWith('santis-') || cacheName.startsWith('sovereign-') || cacheName.startsWith('sovereign_');
                    const isOwnLegacyCache = (cacheName.startsWith('sovereign_mfe_cache_') && cacheName !== MFE_CACHE_NAME) ||
                                             (cacheName.startsWith('sovereign_api_cache_') && cacheName !== API_CACHE_NAME);

                    if (!isSovereignOSCache || isOwnLegacyCache) {
                        console.warn(`[SW] Eski Cache İmha Ediliyor: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 📡 1. WEBSOCKET BAĞLANTILARI: BYPASS (Asla önbelleğe alma)
    if (url.protocol.startsWith('ws') || event.request.headers.get('upgrade') === 'websocket') {
        return;
    }

    // 🧩 2. MFE MODULES (RemoteEntry.js & Chunks): STALE-WHILE-REVALIDATE Stratejisi
    if (url.pathname.includes('/mfe/')) {
        event.respondWith(
            caches.open(MFE_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    // Arka planda sessizce (Silently) sunucudan yenisini çek
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        // Yeni dosyayla önbelleği güncelle
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => null);

                    // Eğer cache varsa cache'i dön (Sıfır gecikme), yoksa ağı bekle
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // 💾 3. API ISTEKLERI: NETWORK FIRST (Fallback to Cache)
    if (url.pathname.startsWith('/api/v1/')) {
        event.respondWith(
            fetch(event.request).then((response) => {
                // Sadece başarılı GET isteklerini cache'le (Read-Only Offline Modu)
                if (event.request.method === 'GET' && response.status === 200) {
                    const cloned = response.clone();
                    caches.open(API_CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return response;
            }).catch(async () => {
                // Ağ Vurulduğunda (Offline)
                console.warn(`[SW] Şebeke Çöktü! API İsteği Önbellekten Sunuluyor: ${url.pathname}`);

                // Read-Only destek için offline cache'e bak
                const cachedRes = await caches.match(event.request);
                if (cachedRes) return cachedRes;

                // Write isteklerini (POST/PUT) bir IndexedDB Queue'ya gönderip (Sync Agent) bekletmeliyiz.
                if (event.request.method !== 'GET') {
                    // Not: Tam Sync API entegrasyonu "BackgroundSync" ile yapılır. Şimdilik simüle ediyoruz.
                    return new Response(JSON.stringify({
                        status: 'QUEUED',
                        message: 'Sistem şu an Çevrimdışı. Veriniz güvenli kilit altında tutuluyor.'
                    }), { headers: { 'Content-Type': 'application/json' } });
                }

                return new Response("Ağ ve Veri Koptu.", { status: 503 });
            })
        );
        return;
    }

    // 🌐 4. HTML PAGES: EDGE HTML STRATEGY (Network First with Cache Fallback)
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
