/**
 * 🦅 SANTIS OS: THE SHADOW WORKER (SOVEREIGN PWA)
 * @version V27_NETWORK_FIRST_HOTFIX
 * @description Offline Zırhı — JS dosyaları artık Network-First ile taze kalıyor
 */

const CACHE_NAME = 'santis-core-v29';     // ← v29: clone fix aktif
const DYNAMIC_CACHE = 'santis-dynamic-v29';

// Çekirdek statik assets (HTML + manifest)
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/admin/god-mode.html',
    '/admin/assets/js/santis-neural-map.js',
    '/admin/assets/js/vendor/vis-network.min.js'
];

// 1. KURULUM
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('🌑 [Shadow Worker] Kuantum Önbellek Mühürlendi. Zırh giyiliyor...');
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// 2. AKTİVASYON — Eski cache temizle
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
                        console.warn(`🔥 [Shadow Worker] Eski zırh eritildi: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. FETCH — JS/JSON: Network-First | Diğerleri: Cache-First
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (!url.protocol.startsWith('http')) return;

    // API → Network-First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (request.method === 'GET' && response.status === 200 && response.type === 'basic') {
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, response.clone()));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then(res =>
                    res || new Response(
                        JSON.stringify({ error: "Offline", message: "Sovereign Link koptu." }),
                        { headers: { 'Content-Type': 'application/json' } }
                    )
                ))
        );
        return;
    }

    // ── JS ve JSON dosyaları: NETWORK-FIRST (stale code engellemek için) ──────
    const isScript = url.pathname.endsWith('.js') || url.pathname.endsWith('.json');
    if (isScript) {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        // ✅ Clone'u SYNC al — caches.open() async gap'inden önce (stream tükenmez)
                        const responseToCache = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseToCache));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // ── Diğer statik dosyalar (CSS, img, font) → Cache-First ─────────────────
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Arka planda cache'i tazele — clone sync alınır, async gap öncesi
                fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const toCache = networkResponse.clone(); // ✅ sync
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, toCache));
                    }
                }).catch(() => {});
                return cachedResponse;
            }
            return fetch(request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const toCache = networkResponse.clone(); // ✅ sync — async gap öncesi
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, toCache));
                return networkResponse;
            }).catch(() => {
                if (request.mode === 'navigate') return caches.match('/index.html');
            });
        })
    );
});


