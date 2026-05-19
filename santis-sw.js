/**
 * SANTIS OS - SHADOW WORKER (V28_SANTIS_ULTRA_FLUID)
 * Architecture: Sovereign OS / Zero-Jank / 120 FPS Target
 * 
 * Bu servis çalışanı; ağ bağımsızlığını, performans bütünlüğünü ve
 * deterministik önbellek yönetimini sağlamak için optimize edilmiştir.
 */

const CACHE_VERSION = 'v11.2.7';
const CORE_CACHE_NAME = `santis-core-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `santis-dynamic-${CACHE_VERSION}`;

// 1. Atomic Asset Pre-caching: Sistemin çalışması için gereken minimum hayati varlıklar
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/assets/css/style.css', // DTCG Token'larının barındığı ana CSS (Düzeltildi: style.css)
    '/assets/js/core/santis-bootloader.js',
    '/assets/js/core/santis-core.js',
    '/assets/js/modules/page-router.js',
    '/assets/img/master-logo.png' // Offline durumda bile marka kimliği korunmalı
];

/**
 * INSTALL HOOK: Atomic önbellekleme yapılır.
 * Hata anında sessizce fail olmaması için Promise döner.
 */
self.addEventListener('install', (event) => {
    console.log('[Shadow Worker] Installing Sovereign Cache...');
    // Global skipWaiting() kullanımı bilinçli olarak bırakıldı, 
    // ancak sayfa yenileme tetikleyicisi UI katmanında kontrol edilmelidir.
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CORE_CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
});

/**
 * ACTIVATE HOOK: Eski sürüm önbellekleri temizlenir.
 */
self.addEventListener('activate', (event) => {
    console.log('[Shadow Worker] Activating & Clearing Old Reality...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CORE_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log(`[Shadow Worker] Purging legacy cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/**
 * HELPER: Adaptive Timeout (1.2s Santis Standardı)
 * Verilen sürede ağ yanıt vermezse promise reject edilir.
 */
const fetchWithTimeout = (request, timeout = 1200) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Network timeout')), timeout);
        fetch(request).then(
            (response) => {
                clearTimeout(timer);
                resolve(response);
            },
            (err) => {
                clearTimeout(timer);
                reject(err);
            }
        );
    });
};

/**
 * FETCH HOOK: İsteklerin yönlendirildiği ana trafik kontrolörü.
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // 1. Video & Range Request Bypass: Büyük medyalar ve Safari/iOS Range istekleri 
    // doğrudan ağa yönlendirilir. Önbellek şişmesi ve main-thread bloğu önlenir.
    if (request.destination === 'video' || request.headers.has('range')) {
        event.respondWith(fetch(request));
        return;
    }

    // 2. HTML ve Navigasyon (Adaptive Timeout - Network First, then Cache)
    if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetchWithTimeout(request, 1200) // 1.2 saniye sınırı
                .then((response) => {
                    // Başarılı ağ yanıtı: Dinamik önbelleği güncelle ve yanıtı dön
                    if (response && response.status === 200 && response.type === 'basic') {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Timeout veya ağ hatası: Sovereign Cache'den (veya fallback'ten) dön
                    console.warn('[Shadow Worker] Network threshold exceeded. Serving reality from cache.');
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/index.html'); // Kırık linkler için güvenli liman
                    });
                })
        );
        return;
    }

    // 3. Statik Varlıklar (Stale-While-Revalidate)
    // Görseller, CSS ve fontlar için anında yanıt ver, arka planda sessizce güncelle.
    if (['style', 'script', 'image', 'font'].includes(request.destination)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const networkFetch = fetch(request).then((networkResponse) => {
                    // Sadece geçerli yanıtları önbelleğe al
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseClone = networkResponse.clone();
                        caches.open(CORE_CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                }).catch(err => console.log('[Shadow Worker] Offline asset fetch failed.', err));

                // Önbellekte varsa hemen dön, yoksa ağ isteğini bekle
                return cachedResponse || networkFetch;
            })
        );
        return;
    }
});
