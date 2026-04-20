/**
 * SANTIS SOVEREIGN OS - Canonical Service Worker v2.1
 * Production-Hardened: fail-soft install, versioned cache, stale cleanup
 */

const CACHE_VERSION = "v3.0_OMEGA";
const CACHE_NAME = `santis-sovereign-${CACHE_VERSION}`;
const SECURE_CACHE = `santis-sanctuary-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// ─── Precache listesi (Temizlenmiş Root Mimarisi) ───────────────────────────
// Her asset Promise.allSettled ile paralel fetch edilir. 404 olsa bile install iptal edilmez.
const PRECACHE_ASSETS = [
    "/",
    "/index.html",
    "/offline.html",
    "/manifest.json",
    "/assets/css/style.css",
    "/assets/js/app.js",
    "/assets/js/boot/santis-bootloader.js",
];

// ─── Install: 404-safe, fail-soft (Promise.allSettled) ───────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            // Kırılgan 'addAll' yerine esnek 'allSettled' asenkron mimarisi:
            const results = await Promise.allSettled(
                PRECACHE_ASSETS.map(async (url) => {
                    const req = new Request(url, { cache: "no-cache" });
                    const res = await fetch(req);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    await cache.put(req, res);
                    return url;
                }),
            );

            const cachedFiles = results.filter(
                (r) => r.status === "fulfilled",
            ).length;
            const failedFiles = results.filter((r) => r.status === "rejected");

            console.log(
                `[Sovereign SW] Kiosk Install Complete — Succesful: ${cachedFiles}/${PRECACHE_ASSETS.length}`,
            );
            if (failedFiles.length > 0) {
                console.warn(
                    `[Sovereign SW] Precache Warning (Ignored): ${failedFiles.length} files failed to cache.`,
                );
            }

            await self.skipWaiting();
        })(),
    );
});

// ─── Activate: Eski cache sürümlerini temizle ─────────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            const valid = new Set([CACHE_NAME, SECURE_CACHE]);
            const stale = keys.filter((k) => !valid.has(k));

            await Promise.all(
                stale.map((k) => {
                    console.log(`[SW] Stale cache deleted: ${k}`);
                    return caches.delete(k);
                }),
            );

            await self.clients.claim();
            console.log(
                `[SW] Activate complete — ${stale.length} stale cache(s) removed`,
            );
        })(),
    );
});

// ─── Fetch Router ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);

    if (req.method !== "GET") return;
    if (!url.protocol.startsWith("http")) return;
    if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;
    // API ve WS isteklerini asla intercept etme
    if (url.pathname.startsWith("/api/")) return;
    if (url.pathname.startsWith("/ws")) return;
    if (url.hostname.includes("tailwindcss.com")) return;

    // A. Admin / Sanctuary → Network-First
    if (
        url.pathname.includes("/sanctuary/") ||
        url.pathname.includes("/admin/")
    ) {
        event.respondWith(networkFirst(req, SECURE_CACHE));
        return;
    }

    // B. Görseller → Cache-First
    if (url.pathname.startsWith("/assets/img/")) {
        event.respondWith(cacheFirst(req, CACHE_NAME));
        return;
    }

    // C. HTML navigasyonu → Network-First + offline fallback
    if (req.mode === "navigate") {
        event.respondWith(networkFirst(req, CACHE_NAME, OFFLINE_URL));
        return;
    }

    // D. JS / CSS / Font → Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(req, CACHE_NAME));
});

// ─── Strateji: Network-First ──────────────────────────────────────────────────
async function networkFirst(req, cacheName, fallbackUrl) {
    try {
        const res = await fetch(req);
        if (res.ok) {
            const cache = await caches.open(cacheName);
            cache.put(req, res.clone());
        }
        return res;
    } catch (_) {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (fallbackUrl) return caches.match(fallbackUrl);
        return new Response("Offline", { status: 503 });
    }
}

// ─── Strateji: Cache-First ────────────────────────────────────────────────────
async function cacheFirst(req, cacheName) {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
        const res = await fetch(req);
        if (res.ok) {
            const cache = await caches.open(cacheName);
            cache.put(req, res.clone());
        }
        return res;
    } catch (_) {
        return new Response("Asset unavailable", { status: 503 });
    }
}

// ─── Strateji: Stale-While-Revalidate ────────────────────────────────────────
async function staleWhileRevalidate(req, cacheName) {
    const cached = await caches.match(req);

    const fetchPromise = fetch(req)
        .then(async (res) => {
            if (res.ok) {
                const cache = await caches.open(cacheName);
                await cache.put(req, res.clone());
            }
            return res;
        })
        .catch(() => null);

    return (
        cached || fetchPromise || new Response("Unavailable", { status: 503 })
    );
}

// ─── Push Notifications (Sovereign Whisper) ───────────────────────────────────
self.addEventListener("push", (event) => {
    if (!(self.Notification && self.Notification.permission === "granted"))
        return;

    const data = event.data
        ? event.data.json()
        : {
              title: "SANTIS",
              body: "Sovereign sığınakta bir hareketlilik var.",
              icon: "/assets/img/icons/icon-192.png",
          };

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon ?? "/assets/img/icons/icon-192.png",
            badge: "/assets/img/icons/icon-192.png",
            vibrate: [100, 50, 100],
            data: { url: data.url ?? "/" },
            actions: [
                { action: "open", title: "Sığınağa Gir" },
                { action: "close", title: "Kapat" },
            ],
        }),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    if (event.action === "open" || !event.action) {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});
