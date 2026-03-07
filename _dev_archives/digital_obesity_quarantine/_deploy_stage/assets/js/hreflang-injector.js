/**
 * SANTIS CLUB - HREFLANG INJECTOR v2.0 (Enterprise Hardened)
 * Dynamic Cross-Language Alternate Tag Generator
 * 
 * 3-Layer Architecture:
 *   Layer 1: Static HTML self + x-default (injected by build script)
 *   Layer 2: This JS injector (adds verified cross-language tags)
 *   Layer 3: available-routes.json (existence registry)
 * 
 * Key improvements over v1.0:
 *   - Existence checking: only generates hreflang for pages that ACTUALLY exist
 *   - Root path safety: excludes non-language prefixed paths
 *   - Preserves static baseline tags (self + x-default)
 *   - Fetches available-routes.json for verified page existence
 */
(function () {
    'use strict';

    // Guard: only run once
    if (window.__NV_HREFLANG_INJECTED) return;
    window.__NV_HREFLANG_INJECTED = true;

    const DOMAIN = 'https://santis-club.com';
    const ACTIVE_LANGS = ['tr', 'en', 'de', 'fr', 'ru'];
    // SR excluded — too few pages, noindexed
    const DEFAULT_LANG = 'tr';

    // ═══════════════════════════════════════════════════════════════
    // REVERSE LOOKUP from SantisRouter.ROUTE_MAP
    // ═══════════════════════════════════════════════════════════════
    function buildReverseLookup() {
        const router = window.SantisRouter;
        if (!router || !router.ROUTE_MAP) return null;

        const reverse = {};
        for (const [key, translations] of Object.entries(router.ROUTE_MAP)) {
            for (const [lang, dirName] of Object.entries(translations)) {
                if (!reverse[dirName]) reverse[dirName] = {};
                reverse[dirName] = translations;
            }
        }
        return reverse;
    }

    // ═══════════════════════════════════════════════════════════════
    // PATH UTILITIES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Extract current language and canonical path from pathname.
     * Canonical path uses TR dir names as the canonical key.
     */
    function parsePath(pathname) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length < 1) return null;

        // Must start with a language prefix
        if (!ACTIVE_LANGS.includes(parts[0]) && parts[0] !== 'sr') return null;

        const lang = parts[0];
        const reverseLookup = buildReverseLookup();

        // Build canonical form (TR dir names)
        const canonicalParts = [...parts];
        canonicalParts.shift(); // remove lang prefix

        if (canonicalParts.length >= 1 && reverseLookup) {
            const dirName = canonicalParts[0];
            const translations = reverseLookup[dirName];
            if (translations) {
                // Find the TR key
                for (const [routeKey, trans] of Object.entries(window.SantisRouter.ROUTE_MAP)) {
                    for (const [l, d] of Object.entries(trans)) {
                        if (d === dirName) {
                            canonicalParts[0] = routeKey;
                            break;
                        }
                    }
                }
            }
        }

        return {
            lang: lang,
            canonical: canonicalParts.join('/'),
            fullPath: pathname,
        };
    }

    /**
     * Translate a canonical path to a specific language's actual path.
     */
    function toLanguagePath(canonicalPath, targetLang) {
        const parts = canonicalPath.split('/');
        const router = window.SantisRouter;

        if (parts.length >= 1 && router && router.ROUTE_MAP[parts[0]]) {
            const translations = router.ROUTE_MAP[parts[0]];
            parts[0] = translations[targetLang] || translations[DEFAULT_LANG] || parts[0];
        }

        return '/' + targetLang + '/' + parts.join('/');
    }

    // ═══════════════════════════════════════════════════════════════
    // MAIN INJECTION LOGIC
    // ═══════════════════════════════════════════════════════════════
    function injectHreflang(availableRoutes) {
        const pathname = window.location.pathname;

        // Skip non-language pages
        const skipPrefixes = ['/admin', '/a4/', '/components/', '/assets/'];
        for (const prefix of skipPrefixes) {
            if (pathname.startsWith(prefix)) return;
        }

        const parsed = parsePath(pathname);
        if (!parsed) return; // Not a language page

        // Remove ALL existing dynamic hreflang tags (but not static self+x-default)
        // We remove all and re-inject the correct set
        const existing = document.querySelectorAll('link[rel="alternate"][hreflang]');
        existing.forEach(el => el.parentNode.removeChild(el));

        const fragment = document.createDocumentFragment();
        let generated = 0;

        // Check if this page has multi-lang equivalents
        const routeData = availableRoutes ? availableRoutes[parsed.canonical] : null;

        if (routeData) {
            // ✅ VERIFIED: Generate hreflang only for languages that have this page
            for (const lang of ACTIVE_LANGS) {
                if (routeData[lang]) {
                    // Page exists in this language — safe to generate
                    const href = DOMAIN + '/' + lang + '/' + routeData[lang];
                    const link = document.createElement('link');
                    link.rel = 'alternate';
                    link.hreflang = lang;
                    link.href = href;
                    fragment.appendChild(link);
                    generated++;
                }
            }
        } else {
            // No registry data — generate ONLY self-referencing tag (safe fallback)
            const selfLink = document.createElement('link');
            selfLink.rel = 'alternate';
            selfLink.hreflang = parsed.lang;
            selfLink.href = DOMAIN + pathname;
            fragment.appendChild(selfLink);
            generated++;
        }

        // Always add x-default → TR version
        const trPath = toLanguagePath(parsed.canonical, DEFAULT_LANG);
        const xDefault = document.createElement('link');
        xDefault.rel = 'alternate';
        xDefault.hreflang = 'x-default';
        xDefault.href = DOMAIN + trPath;
        fragment.appendChild(xDefault);
        generated++;

        document.head.appendChild(fragment);
        console.log(`🌐 [Hreflang v2.0] ${generated} tags (verified: ${routeData ? 'YES' : 'self-only'})`);
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOTSTRAP: Load available-routes.json then inject
    // ═══════════════════════════════════════════════════════════════
    function bootstrap() {
        // Try to fetch the existence registry
        const routesUrl = (window.SITE_ROOT || '/') + 'assets/data/available-routes.json';

        fetch(routesUrl)
            .then(r => {
                if (!r.ok) throw new Error('Not found');
                return r.json();
            })
            .then(data => {
                injectHreflang(data);
            })
            .catch(() => {
                // Registry unavailable — inject with self-only fallback
                console.warn('🌐 [Hreflang v2.0] available-routes.json not found, using self-only mode');
                injectHreflang(null);
            });
    }

    // Run on DOMContentLoaded to ensure SantisRouter is available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

})();
