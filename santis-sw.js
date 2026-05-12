/**
 * 🦅 SANTIS OS: THE SHADOW WORKER (SOVEREIGN PWA)
 * @version V27_NETWORK_FIRST_HOTFIX
 * @description Offline Zırhı — JS dosyaları artık Network-First ile taze kalıyor
 */

const CACHE_NAME = 'santis-core-v51-ghost-v1.4'; 
const DYNAMIC_CACHE = 'santis-dynamic-v51-ghost-v1.4';

// Çekirdek statik assets (HTML + manifest)
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/assets/data/fallback-data.json'
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
    if (request.method !== 'GET') return;
    if (request.headers.get('upgrade') === 'websocket') return;

    // 🔴 BUG FİX: Chrome DevTools "Update on reload" hatasını (only-if-cached) önler
    // Workbox'ın da kullandığı standart koruma. "Failed to execute 'fetch' on 'WorkerGlobalScope'" hatasını çözer.
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
        return;
    }

    // API → Network-First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(() => fetch(request.url)) // B Planı: Chrome DevTools reload fix
                .then(response => {
                    if (request.method === 'GET' && response.status === 200 && response.type === 'basic') {
                        const responseToCache = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseToCache).catch(() => {}));
                    }
                    return response;
                })
                .catch(() => caches.match(request, { ignoreSearch: true }).then(res =>
                    res || new Response(
                        JSON.stringify({ error: "Offline", message: "Sovereign Link koptu." }),
                        { headers: { 'Content-Type': 'application/json' } }
                    )
                ))
        );
        return;
    }

    // ── /admin/* → NETWORK-FIRST (her zaman taze alınır) ─────────
    if (url.pathname.startsWith('/admin/')) {
        event.respondWith(
            fetch(request).catch(() => fetch(request.url)) // B planı: Chrome DevTools reload fix
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const toCache = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, toCache).catch(() => {}));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Admin sayfası için path fallback'i (örn: /admin/ istenirse /admin/index.html bak)
                    const searchPath = (url.pathname === '/admin/' || url.pathname === '/admin') ? '/admin/index.html' : request;
                    return caches.match(searchPath, { ignoreSearch: true }).then(res => {
                        return res || caches.match('/offline.html', { ignoreSearch: true }).then(off => off || new Response('Admin Offline', { status: 503 }));
                    });
                })
        );
        return;
    }

    // ── JS ve JSON dosyaları: NETWORK-FIRST (stale code engellemek için) ──────
    const isScript = url.pathname.endsWith('.js') || url.pathname.endsWith('.json');
    if (isScript) {
        event.respondWith(
            fetch(request).catch(() => fetch(request.url)) // B planı: Chrome DevTools reload fix
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        // ✅ Clone'u SYNC al — caches.open() async gap'inden önce (stream tükenmez)
                        const responseToCache = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseToCache).catch(() => {}));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(request, { ignoreSearch: true }).then(res => res || new Response(
                    JSON.stringify({ error: "Offline", message: "Network Link Severed." }),
                    { headers: { 'Content-Type': 'application/json' }, status: 503 }
                )))
        );
        return;
    }

    // ── HTML Sayfaları & SPA Yönlendirmeleri → Network-First (Timeout'lu) ─────────
    const isNavigation = request.mode === 'navigate' || request.headers.get('X-SPA-Navigation') === 'true' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
    
    if (isNavigation) {
        event.respondWith(
            Promise.race([
                fetch(request).catch(() => fetch(request.url)),
                new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000))
            ])
            .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const toCache = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, toCache).catch(() => {}));
                }
                return networkResponse;
            })
            .catch(() => caches.match(request, { ignoreSearch: true }).then(res => {
                return res || caches.match('/offline.html', { ignoreSearch: true }).then(offlineRes => {
                    return offlineRes || caches.match('/index.html', { ignoreSearch: true }).then(indexRes => {
                        return indexRes || new Response('Santis Offline Sanctuary', { status: 503 });
                    });
                });
            }))
        );
        return;
    }

    // ── Diğer statik dosyalar (CSS, img, font) → Cache-First ─────────────────
    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
            if (cachedResponse) {
                // Arka planda cache'i tazele — clone sync alınır, async gap öncesi
                fetch(request).catch(() => fetch(request.url)).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const toCache = networkResponse.clone(); // ✅ sync
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, toCache).catch(() => {}));
                    }
                }).catch(() => {});
                return cachedResponse;
            }
            return fetch(request).catch(() => fetch(request.url)).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const toCache = networkResponse.clone(); // ✅ sync — async gap öncesi
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, toCache).catch(() => {}));
                return networkResponse;
            }).catch(() => {
                return new Response('', {status: 408, statusText: 'Request Timeout'});
            });
        })
    );
});


