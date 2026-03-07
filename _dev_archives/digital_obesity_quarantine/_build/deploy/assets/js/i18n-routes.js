/**
 * SANTIS CLUB - i18n ROUTES v1.0
 * Merkezi URL Çeviri Motoru
 * 
 * Tüm dil-bazlı URL çevirilerini tek merkezden yönetir.
 * Diğer tüm JS dosyaları bunu kullanır.
 */
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // ROUTE MAP — Dizin adı çevirileri
    // ═══════════════════════════════════════════════════════════════
    const ROUTE_MAP = {
        'masajlar': { tr: 'masajlar', en: 'massages', de: 'massagen', fr: 'massages', ru: 'massages' },
        'hamam': { tr: 'hamam', en: 'hammam', de: 'hammam', fr: 'hammam', ru: 'hammam' },
        'cilt-bakimi': { tr: 'cilt-bakimi', en: 'services', de: 'services', fr: 'services', ru: 'services' },
        'urunler': { tr: 'urunler', en: 'products', de: 'products', fr: 'products', ru: 'products' },
        'galeri': { tr: 'galeri', en: 'gallery', de: 'gallery', fr: 'gallery', ru: 'gallery' },
        'hizmetler': { tr: 'hizmetler', en: 'services', de: 'services', fr: 'services', ru: 'services' },
        'hakkimizda': { tr: 'hakkimizda', en: 'about', de: 'about', fr: 'about', ru: 'about' },
        'ekibimiz': { tr: 'ekibimiz', en: 'team', de: 'team', fr: 'team', ru: 'team' },
        'blog': { tr: 'blog', en: 'blog', de: 'blog', fr: 'blog', ru: 'blog' },
        'bilgelik': { tr: 'bilgelik', en: 'wisdom', de: 'wisdom', fr: 'wisdom', ru: 'wisdom' },
        'rezervasyon': { tr: 'rezervasyon', en: 'booking', de: 'booking', fr: 'booking', ru: 'booking' },
        'magaza': { tr: 'magaza', en: 'shop', de: 'shop', fr: 'shop', ru: 'shop' },
    };

    const SUPPORTED_LANGS = ['tr', 'en', 'de', 'fr', 'ru', 'sr'];
    const DEFAULT_LANG = 'tr';

    // ═══════════════════════════════════════════════════════════════
    // DETECT CURRENT LANGUAGE
    // ═══════════════════════════════════════════════════════════════
    function detectLang() {
        const path = window.location.pathname;
        for (const lang of SUPPORTED_LANGS) {
            if (path.startsWith('/' + lang + '/')) return lang;
        }
        // Check cookie
        const match = (document.cookie.match(/santis_lang=(\w+)/) || [])[1];
        if (match && SUPPORTED_LANGS.includes(match)) return match;
        // Check html lang attribute
        const htmlLang = document.documentElement.lang;
        if (htmlLang && SUPPORTED_LANGS.includes(htmlLang)) return htmlLang;
        return DEFAULT_LANG;
    }

    // ═══════════════════════════════════════════════════════════════
    // TRANSLATE PATH
    // ═══════════════════════════════════════════════════════════════
    /**
     * Translates a URL path from any language to the target language.
     * @param {string} path - e.g. "/tr/masajlar/index.html"
     * @param {string} [targetLang] - target language code (default: current page lang)
     * @returns {string} translated path, e.g. "/en/massages/index.html"
     */
    function translate(path, targetLang) {
        if (!path) return path;
        targetLang = targetLang || detectLang();

        // Parse path
        const clean = path.startsWith('/') ? path : '/' + path;
        const parts = clean.split('/').filter(Boolean);

        if (parts.length < 1) return clean;

        // Check if first part is a language code
        let srcLang = null;
        if (SUPPORTED_LANGS.includes(parts[0])) {
            srcLang = parts[0];
        }

        if (!srcLang) {
            // No language prefix — don't modify
            return clean;
        }

        // Replace language prefix
        parts[0] = targetLang;

        // Translate directory name (second segment)
        if (parts.length >= 2) {
            const dirName = parts[1];
            // Find mapping: check all source languages
            for (const [key, translations] of Object.entries(ROUTE_MAP)) {
                for (const [lang, translated] of Object.entries(translations)) {
                    if (translated === dirName) {
                        // Found! Now translate to target lang
                        parts[1] = translations[targetLang] || translations[DEFAULT_LANG] || dirName;
                        break;
                    }
                }
            }
        }

        return '/' + parts.join('/');
    }

    // ═══════════════════════════════════════════════════════════════
    // LOCALIZE HREF — Auto-translate based on current page language
    // ═══════════════════════════════════════════════════════════════
    /**
     * Convenience function: translates a /tr/-based href to current language.
     * Usage in templates: SantisRouter.localize('/tr/masajlar/index.html')
     * @param {string} href
     * @returns {string}
     */
    function localize(href) {
        return translate(href, detectLang());
    }

    // ═══════════════════════════════════════════════════════════════
    // GET CATEGORY PATH — Returns localized category index path
    // ═══════════════════════════════════════════════════════════════
    function categoryPath(categoryKey, lang) {
        lang = lang || detectLang();
        const entry = ROUTE_MAP[categoryKey];
        if (!entry) return '/' + lang + '/' + categoryKey + '/index.html';
        const dir = entry[lang] || entry[DEFAULT_LANG] || categoryKey;
        return '/' + lang + '/' + dir + '/index.html';
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════
    const SantisRouter = {
        ROUTE_MAP,
        SUPPORTED_LANGS,
        detectLang,
        translate,
        localize,
        categoryPath,
    };

    window.SantisRouter = SantisRouter;
    console.log('🌐 Santis i18n Routes v1.0 loaded. Lang:', detectLang());
})();
