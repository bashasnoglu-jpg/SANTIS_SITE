/**
 * SANTIS OS - GLOBAL FETCH INTERCEPTOR (BLOK F1)
 * "Ultra Mega" Class - L1/L2 Caching, Deduplication, Stale-While-Revalidate, and Edge Routing.
 */

(function initSantisFetchBridge() {
    if (window._santisBridgeActive) return;
    window._santisBridgeActive = true;

    console.log("🌉 [SANTIS BRIDGE] Initializing Ultra-Mega Fetch Interceptor...");

    const originalFetch = window.fetch;
    const inflightRequests = new Map(); // L1 Deduplication Map

    // Storage Wrapper for L2 Caching
    const L2Cache = {
        get: (key) => {
            try { return JSON.parse(localStorage.getItem(`santis_cache_${key}`)); }
            catch { return null; }
        },
        set: (key, data, etag) => {
            try {
                localStorage.setItem(`santis_cache_${key}`, JSON.stringify({ data, etag, ts: Date.now() }));
            } catch (e) {
                console.warn("[SANTIS BRIDGE] L2 Cache Quota Exceeded or Blocked");
            }
        }
    };

    /**
     * Translates legacy static paths to the O(1) Edge API.
     */
    function resolveEdgeUrl(originalUrl) {
        // Example legacy: /assets/data/content/services/massage.json
        // Or: /data/services/massage.json
        const match = originalUrl.match(/content\/services\/([a-zA-Z0-9_-]+)\.json$/);
        if (match) {
            const slug = match[1];
            const region = window.SITE_LANG || 'tr';
            // Rewrite to Edge Resolver
            return `/api/v1/content/resolve/${slug}?region=${region}&locale=${region}`;
        }
        return originalUrl; // Unmodified if not matching pattern
    }

    /**
     * Stale-While-Revalidate Engine
     */
    async function executeSWRFetch(targetUrl, cacheKey, originalConfig) {
        // 1. Check L2 Cache (Immediate Return if Valid)
        const cached = L2Cache.get(cacheKey);

        let headers = new Headers(originalConfig.headers || {});
        if (cached && cached.etag) {
            headers.set('If-None-Match', cached.etag);
        }

        const fetchConfig = { ...originalConfig, headers };

        try {
            const response = await originalFetch(targetUrl, fetchConfig);

            if (response.status === 304 && cached) {
                // Not Modified - ETag matched, Edge says our L2 cache is perfect.
                console.debug(`⚡ [SANTIS BRIDGE] 304 Edge Match: ${cacheKey}`);
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Santis-Cache': 'HIT-304' }
                });
            }

            if (response.ok) {
                // Clone response to read JSON for cache
                const cloned = response.clone();
                const data = await cloned.json();
                const etag = response.headers.get('ETag');

                // Update L2 Cache seamlessly
                if (etag) L2Cache.set(cacheKey, data, etag);

                console.debug(`🌐 [SANTIS BRIDGE] Over-the-wire Fetch: ${cacheKey}`);
                // If we returned stale cache earlier, we could dispatch a DOM update event here.
                window.dispatchEvent(new CustomEvent('santis:content-updated', { detail: { key: cacheKey, data } }));

                return response;
            }

            // Fallback for 404s/500s but we have old cached state
            if (cached) {
                console.warn(`⚠️ [SANTIS BRIDGE] Edge Error ${response.status}. Serving purely from L2 Stale Cache.`);
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Santis-Cache': 'STALE-RECOVERY' }
                });
            }

            return response; // Throw to native caller
        } catch (error) {
            if (cached) {
                console.error(`🚨 [SANTIS BRIDGE] Network Failure. Serving L2 Cache Offline Mode.`, error);
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Santis-Cache': 'OFFLINE' }
                });
            }
            throw error;
        }
    }

    // Replace native fetch
    window.fetch = async function (resource, config = {}) {
        let urlStr = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : String(resource));

        // 1. Translation Phase
        const targetUrl = resolveEdgeUrl(urlStr);

        // Optimize: If it's a content API or mapped static file, we apply SWR. Otherwise pass through.
        if (targetUrl.includes('/api/v1/content/resolve') || targetUrl.includes('.json')) {
            const cacheKey = btoa(targetUrl).substring(0, 16); // Safe base64 key

            // 2. Deduplication Phase (L1 Network Throttling)
            if (inflightRequests.has(cacheKey)) {
                console.debug(`🛡️ [SANTIS BRIDGE] Deduplicating parallel request: ${targetUrl}`);
                return inflightRequests.get(cacheKey).then(res => res.clone());
            }

            // 3. Execution Phase
            const requestPromise = executeSWRFetch(targetUrl, cacheKey, config).finally(() => {
                inflightRequests.delete(cacheKey);
                setTimeout(() => inflightRequests.delete(cacheKey), 50); // slight buffer
            });

            inflightRequests.set(cacheKey, requestPromise);
            return requestPromise;
        }

        // Pass-through for standard traffic (images, html, etc)
        return originalFetch(resource, config);
    };
})();
