/**

 * SANTIS CLUB - URL NORMALIZER

 * URL Normalizasyon & Redirect Sistemi v1.0

 * 

 * Bu dosya:

 * 1. Eski statik sayfa URL'lerini dinamik sisteme yönlendirir

 * 2. URL'leri normalize eder (lowercase, trailing slash)

 * 3. Canonical URL'leri yönetir

 */



(function () {

    'use strict';



    // ═══════════════════════════════════════════════════════════════

    // LEGACY REDIRECT MAP

    // Eski statik sayfalar → Yeni dinamik sayfalar

    // ═══════════════════════════════════════════════════════════════

    const _l = (p) => window.SantisRouter ? SantisRouter.localize(p) : p;
    const LEGACY_REDIRECTS = {

        // Hamam statik sayfaları (artık redirect olarak ayarlandı)

        // Bu map, JavaScript devre dışı kaldığında fallback olarak kalır



        // Eski root URL'ler (ileride kullanılabilir)

        "/hamam.html": _l("/hamam.html"),

        "/massage.html": _l("/masaj.html"),

        "/skincare.html": _l("/cilt-bakimi.html"),

        "/masaj.html": _l("/masaj.html"),

        "/cilt-bakimi.html": _l("/cilt-bakimi.html")

    };



    // ═══════════════════════════════════════════════════════════════

    // URL NORMALİZASYON

    // ═══════════════════════════════════════════════════════════════



    /**

     * URL'yi normalize eder

     * - Lowercase dönüşümü

     * - Trailing slash kaldırma (root hariç)

     */

    function normalizeUrl() {

        const path = window.location.pathname;

        let normalized = path;

        let needsRedirect = false;



        // 1. Lowercase kontrolü (devre dışı - Türkçe karakterler sorun çıkarabilir)

        // if (path !== path.toLowerCase()) {

        //     normalized = path.toLowerCase();

        //     needsRedirect = true;

        // }



        // 2. Trailing slash kaldırma (root, index.html ve dil dizinleri hariç)

        // Language root paths (/en/, /de/, etc.) must keep trailing slash
        // because FastAPI StaticFiles adds it back via 307 → infinite loop
        const LANG_ROOTS = ['/tr/', '/en/', '/de/', '/fr/', '/ru/', '/sr/'];
        const isLangRoot = LANG_ROOTS.includes(normalized);

        if (normalized !== "/" &&

            normalized.endsWith("/") &&

            !normalized.endsWith("index.html") &&

            !isLangRoot) {

            normalized = normalized.slice(0, -1);

            needsRedirect = true;

        }



        // 3. Redirect gerekiyorsa yönlendir

        if (needsRedirect) {

            const newUrl = normalized + window.location.search + window.location.hash;

            window.location.replace(newUrl);

            return true;

        }



        return false;

    }



    // ═══════════════════════════════════════════════════════════════

    // LEGACY REDIRECT KONTROLÜ

    // ═══════════════════════════════════════════════════════════════



    /**

     * Eski URL'leri yeni URL'lere yönlendirir

     */

    function checkLegacyRedirects() {

        const path = window.location.pathname;



        if (LEGACY_REDIRECTS[path]) {

            console.log(`[URL Normalizer] Legacy redirect: ${path} → ${LEGACY_REDIRECTS[path]}`);

            window.location.replace(LEGACY_REDIRECTS[path]);

            return true;

        }



        return false;

    }



    // ═══════════════════════════════════════════════════════════════

    // CANONICAL URL YÖNETİMİ

    // ═══════════════════════════════════════════════════════════════



    /**

     * Canonical tag'i otomatik ekler veya günceller

     */

    function ensureCanonical() {

        // Zaten canonical varsa dokunma

        if (document.querySelector('link[rel="canonical"]')) {

            return;

        }



        // Canonical URL oluştur

        const canonicalUrl = window.location.origin +

            window.location.pathname +

            window.location.search;



        // Link elementi oluştur

        const link = document.createElement('link');

        link.rel = 'canonical';

        link.href = canonicalUrl;



        // Head'e ekle

        document.head.appendChild(link);



        console.log(`[URL Normalizer] Canonical eklendi: ${canonicalUrl}`);

    }



    // ═══════════════════════════════════════════════════════════════

    // HARİCİ LİNK GÜVENLİĞİ

    // ═══════════════════════════════════════════════════════════════



    /**

     * Tüm harici linklere güvenlik attribute'ları ekler

     */

    function secureExternalLinks() {

        document.querySelectorAll('a[href^="http"]').forEach(link => {

            // Kendi domain'imiz değilse

            if (!link.href.includes(window.location.hostname)) {

                link.setAttribute('target', '_blank');

                link.setAttribute('rel', 'noopener noreferrer');

            }

        });

    }



    // ═══════════════════════════════════════════════════════════════

    // ANA BAŞLATICI

    // ═══════════════════════════════════════════════════════════════



    function init() {

        // 1. Legacy redirect kontrolü

        if (checkLegacyRedirects()) return;



        // 2. URL normalize et

        if (normalizeUrl()) return;



        // 3. Canonical tag ekle

        ensureCanonical();



        // 4. Harici linkleri güvenli yap (DOM yüklendikten sonra)

        if (document.readyState === 'loading') {

            document.addEventListener('DOMContentLoaded', secureExternalLinks);

        } else {

            secureExternalLinks();

        }



        console.log("🔗 Santis URL Normalizer v1.0 aktif.");

    }



    // Hemen çalıştır

    init();



})();

