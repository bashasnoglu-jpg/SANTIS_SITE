/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🛡️ SANTIS OS — SOVEREIGN VAULT (PHASE J1)                  ║
 * ║  Stale-While-Revalidate · Offline Fallback · Atomic Cache   ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Disconnected but Stable.
 * 🛡️ ARCHITECTURE: Atomic resource management.
 */

const VAULT_VERSION = 'v1.0.1';
const CORE_CACHE = `santis-core-${VAULT_VERSION}`;
const DYNAMIC_CACHE = `santis-dynamic-${VAULT_VERSION}`;

const CORE_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/assets/css/style.css'
];

/**
 * 1. Installation: Sealing the Vault
 */
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CORE_CACHE).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
});

/**
 * 2. Activation: Memory Discipline (Cleanup)
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CORE_CACHE && cacheName !== DYNAMIC_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

/**
 * 3. Fetching: Stale-While-Revalidate + Offline Fallback
 */
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Update Cache with fresh response
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Network failure: Fallback to offline page if it's a navigation request
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
            });

            // Return cached response immediately (Zero-Jank), otherwise wait for fetch
            return cachedResponse || fetchPromise;
        })
    );
});
