/**
 * ════════════════════════════════════════════════════════════════
 * 🎨 SANTIS OS — KARATA EDGE WORKER (Phase 60)
 * ════════════════════════════════════════════════════════════════
 * Görev: Cloudflare / Miniflare Edge ortamında çalışarak Karata
 * görsel varyantlarını (Hero, Bento, Mini) üretmek.
 * 
 * Zero-Copy mimarisi: Görsel URL'ye dönüşmeden, doğrudan 
 * env.IMAGES.transform() bağlaması üzerinden işlenir.
 *
 * Karata Manifest:
 *   /karata?id=<imageId>&variant=<hero|bento|mini>
 */

// ── Karata Varyant Konfigürasyonu ─────────────────────────────────
const KARATA_VARIANTS = {
    hero:  { width: 1920, height: 1080, fit: 'cover', quality: 92, format: 'webp' },
    bento: { width: 800,  height: 800,  fit: 'cover', quality: 88, format: 'webp' },
    mini:  { width: 900,  height: 600,  fit: 'cover', quality: 85, format: 'webp' },
};

// ── Karata Manifest (Görsel Kaydı) ────────────────────────────────
const KARATA_MANIFEST = {
    'hero-index':    '/assets/img/hero.jpg',
    'hamam-bento':   '/assets/img/hamam.jpg',
    'masaj-bento':   '/assets/img/masaj.jpg',
    'cilt-bento':    '/assets/img/ciltbakimi.jpg',
    'recovery-mini': '/assets/img/recovery.jpg',
    'detox-mini':    '/assets/img/detox.jpg',
};

// ── Edge Worker Fetch Handler ──────────────────────────────────────
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Sadece /karata route'unu işle
        if (!url.pathname.startsWith('/karata')) {
            return new Response('Not Found', { status: 404 });
        }

        const imageId = url.searchParams.get('id');
        const variant = url.searchParams.get('variant') || 'bento';

        // ── Parametre kontrolü ────────────────────────────────────
        if (!imageId || !KARATA_MANIFEST[imageId]) {
            return new Response(
                JSON.stringify({ error: 'Unknown image ID', available: Object.keys(KARATA_MANIFEST) }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        if (!KARATA_VARIANTS[variant]) {
            return new Response(
                JSON.stringify({ error: 'Unknown variant', available: Object.keys(KARATA_VARIANTS) }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const srcPath = KARATA_MANIFEST[imageId];
        const config  = KARATA_VARIANTS[variant];

        // ── Cache Kontrolü (Stale-While-Revalidate) ───────────────
        const cacheKey = new Request(`${url.origin}/karata-cache/${imageId}/${variant}`, request);
        const cache    = caches.default;
        let response   = await cache.match(cacheKey);

        if (response) {
            // Cache hit — X-Cache-Status header ekle
            const headers = new Headers(response.headers);
            headers.set('X-Cache-Status', 'HIT');
            return new Response(response.body, { ...response, headers });
        }

        // ── Zero-Copy Görsel Dönüşümü ─────────────────────────────
        // env.IMAGES Cloudflare Images API bağlaması
        // Fallback: Miniflare lokal ortamı için ham URL döndür
        if (env?.IMAGES) {
            // Cloudflare üretim ortamı
            response = await env.IMAGES.transform(
                new Request(`${url.origin}${srcPath}`),
                {
                    width:   config.width,
                    height:  config.height,
                    fit:     config.fit,
                    quality: config.quality,
                    format:  config.format,
                }
            );
        } else {
            // Miniflare / Lokal geliştirme ortamı — JSON manifest döndür
            response = new Response(
                JSON.stringify({
                    mode:    'development',
                    imageId, variant,
                    src:     srcPath,
                    config,
                    message: 'Cloudflare Images API lokal ortamda simüle edildi.',
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Karata-Variant': variant,
                        'X-Karata-Id':      imageId,
                    }
                }
            );
        }

        // ── Cache'e Yaz (24 saat TTL) ────────────────────────────
        const responseToCache = response.clone();
        const cachedHeaders   = new Headers(responseToCache.headers);
        cachedHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
        cachedHeaders.set('X-Cache-Status', 'MISS');
        cachedHeaders.set('X-Karata-Variant', variant);
        cachedHeaders.set('X-Sovereign-Kyber-Hash', `SNT-KYB-LAT-${Math.random().toString(36).substr(2, 16).toUpperCase()}`);

        const finalResponse = new Response(responseToCache.body, {
            status:  responseToCache.status,
            headers: cachedHeaders,
        });

        ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
        return finalResponse;
    }
};
