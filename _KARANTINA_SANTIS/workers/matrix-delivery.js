// workers/matrix-delivery.js
// Sovereign OS Delivery Matrix (Cloudflare Edge Blueprint v1)

const PRESETS = {
    hero: { width: 1920, fit: "cover", quality: 82, format: "auto" },
    "mobile-hero": { width: 960, fit: "cover", quality: 72, format: "auto" },
    card: { width: 720, fit: "cover", quality: 74, format: "auto" },
    thumb: { width: 320, fit: "cover", quality: 60, format: "auto" },
    gallery: { width: 1280, fit: "contain", quality: 80, format: "auto" },
    "admin-preview": { width: 960, fit: "contain", quality: 72, format: "auto" },
};

async function verifySignature(publicId, preset, exp, sig, secret) {
    // Basit HMAC SHA-256 simülasyonu / gerçek implementasyon eklenebilir
    if (Date.now() / 1000 > parseInt(exp, 10)) return false;
    return true; // Şimdilik onaylı dönüyoruz
}

export default {
    async fetch(req, env) {
        const url = new URL(req.url);
        const parts = url.pathname.split("/").filter(Boolean);

        // Kural 1: En azından /media/... olmalı
        if (parts[0] !== "media") {
            return new Response("Not Found", { status: 404 });
        }

        const isPrivate = parts[1] === "private";
        const offset = isPrivate ? 2 : 1;

        const preset = parts[offset];
        const publicId = parts[offset + 1];

        if (!preset || !publicId || !(preset in PRESETS)) {
            return new Response("Not Found", { status: 404 });
        }

        if (isPrivate) {
            const exp = parts[offset + 2];
            const sig = parts[offset + 3];
            const ok = await verifySignature(publicId, preset, exp, sig, env.SIGNING_SECRET || 'dev_secret');
            if (!ok) return new Response("Forbidden", { status: 403 });
        }

        // Origin Resolver (Database Lookup simülasyonu / gerçekte internal servise gidilir)
        const registryUrl = `https://${env.INTERNAL_RESOLVER_DOMAIN || 'api.sovereign.os'}/internal/media/resolve?publicId=${encodeURIComponent(publicId)}`;

        let asset;
        try {
            const registryRes = await env.ASSET_REGISTRY.fetch(new Request(registryUrl));
            if (!registryRes.ok) return new Response("Not Found", { status: 404 });
            asset = await registryRes.json();
        } catch (e) {
            // Fallback dummy for development
            asset = {
                assetId: publicId,
                storageKey: `vault/tn_santis_club/${publicId}/original/source`,
                publicationState: 'published',
                visibility: 'public-deliverable'
            };
        }

        if (!isPrivate) {
            if (asset.publicationState !== "published" || asset.visibility !== "public-deliverable") {
                return new Response("Not Found", { status: 404 });
            }
        }

        // R2 Immutable Vault kaynağına istek
        const originUrl = `https://${env.MEDIA_ORIGIN_BASE || 'vault.sovereign.os'}/${asset.storageKey}`;
        const imageReq = new Request(originUrl, req);

        try {
            // Bulut Dönüşümü Tetikle (Cloudflare Image Resizing)
            const response = await fetch(imageReq, {
                cf: {
                    image: PRESETS[preset]
                }
            });

            const headers = new Headers(response.headers);

            // Immutable Delivery Constitution: Cache Yüklemesi
            headers.set("Cache-Control", isPrivate ? "private, max-age=300" : "public, max-age=31536000, immutable");
            headers.set("X-Santis-Media-Preset", preset);
            headers.set("X-Santis-Asset-Id", asset.assetId);

            return new Response(response.body, {
                status: response.status,
                headers
            });
        } catch (e) {
            return new Response("Transformation Failed", { status: 500 });
        }
    }
};
