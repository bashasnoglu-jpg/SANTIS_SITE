/**
 * SANTIS Sovereign OS - SW V1 (Integrity Shield)
 * Sprint C: Failure Physics
 */

const CACHE_NAME = 'santis-integrity-v1';
const ASSETS_TO_CACHE = [
    '/assets/js/data/sovereign-rituals.js',
    '/assets/css/pages/santis-massage.css',
    '/assets/js/ui/santis-card-generator.js',
    '/assets/js/ui/santis-surface-controller.js',
    '/assets/img/cards/santis_hero_massage_lux.webp',
    '/assets/img/cards/santis_hero_skincare_lux.webp'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[INTEGRITY]: Armoring assets for offline persistence.');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network First, Fallback to Cache (Veri güncelliği için)
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
