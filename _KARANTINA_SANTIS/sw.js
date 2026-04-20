/* SANTIS Sovereign Service Worker v1.0 */

const SW_VERSION = "santis-sw-v1";
const STATIC_CACHE = `${SW_VERSION}-static`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const HTML_CACHE = `${SW_VERSION}-html`;

const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
    OFFLINE_URL,
    "/assets/css/fonts.css",
    "/assets/css/typography.css",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);
            await cache.addAll(PRECACHE_URLS);
            await self.skipWaiting();
        })(),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter(
                        (key) =>
                            ![STATIC_CACHE, RUNTIME_CACHE, HTML_CACHE].includes(
                                key,
                            ),
                    )
                    .map((key) => caches.delete(key)),
            );

            await self.clients.claim();
        })(),
    );
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticAsset(request));
        return;
    }

    if (isApiRequest(url.pathname)) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    event.respondWith(handleRuntimeRequest(request));
});

async function handleNavigationRequest(request) {
    const cache = await caches.open(HTML_CACHE);

    try {
        const networkResponse = await fetch(request, { cache: "no-store" });

        if (isValidHtmlResponse(networkResponse)) {
            await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;

        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;

        return new Response(
            "<!doctype html><html><body style='background:#0a0a0a;color:#d6d6d8;font-family:Arial,sans-serif;padding:24px'>Offline</body></html>",
            {
                headers: { "Content-Type": "text/html; charset=utf-8" },
                status: 200,
            },
        );
    }
}

async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);

    if (cached) return cached;

    const response = await fetch(request);

    if (isCacheableAssetResponse(response)) {
        await cache.put(request, response.clone());
    }

    return response;
}

async function handleApiRequest(request) {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
        const response = await fetch(request);

        if (response.ok) {
            await cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;

        return new Response(JSON.stringify({ ok: false, offline: true }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
        });
    }
}

async function handleRuntimeRequest(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    if (cached) return cached;

    try {
        const response = await fetch(request);

        if (isCacheableAssetResponse(response)) {
            await cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        return cached || Response.error();
    }
}

function isStaticAsset(pathname) {
    return (
        pathname.startsWith("/assets/") ||
        pathname.endsWith(".js") ||
        pathname.endsWith(".css") ||
        pathname.endsWith(".woff2") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".jpeg") ||
        pathname.endsWith(".webp") ||
        pathname.endsWith(".svg")
    );
}

function isApiRequest(pathname) {
    return pathname.startsWith("/api/");
}

function isValidHtmlResponse(response) {
    if (!response || !response.ok) return false;
    const contentType = response.headers.get("Content-Type") || "";
    return contentType.includes("text/html");
}

function isCacheableAssetResponse(response) {
    if (!response || !response.ok) return false;
    const contentType = response.headers.get("Content-Type") || "";

    return (
        contentType.includes("javascript") ||
        contentType.includes("css") ||
        contentType.includes("font/woff2") ||
        contentType.includes("image/")
    );
}
