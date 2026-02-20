/**
 * SANTIS LANGUAGE BRIDGE (Phase 26)
 * Geo-Location Based Auto Redirect
 */
(function () {
    const COOKIE_NAME = 'santis_lang';
    const SUPPORTED_LANGS = ['tr', 'en', 'de', 'ru', 'fr', 'sr'];

    // Check if user has already chosen a language
    if (document.cookie.indexOf(COOKIE_NAME) !== -1) {
        console.log("BRIDGE: Language preference found. Skipping auto-redirect.");
        return;
    }

    // Check if we are already on a language specific page (e.g. /en/...)
    const path = window.location.pathname;
    const currentLangFromUrl = SUPPORTED_LANGS.find(l => path.startsWith(`/${l}/`));

    if (currentLangFromUrl) {
        // User is already on a specific lang page. 
        // We should set the cookie to remember this choice.
        document.cookie = `${COOKIE_NAME}=${currentLangFromUrl}; path=/; max-age=31536000`; // 1 year
        return;
    }

    // If we are at root /, let's check location
    fetch('/api/geo/location')
        .then(res => res.json())
        .then(data => {
            const country = data.countryCode;
            let targetLang = 'en'; // Default fallback

            // Map Country to Language
            switch (country) {
                case 'TR': targetLang = 'tr'; break;
                case 'DE':
                case 'AT':
                case 'CH': targetLang = 'de'; break;
                case 'RU':
                case 'UA':
                case 'KZ': targetLang = 'ru'; break;
                case 'FR':
                case 'BE': targetLang = 'fr'; break;
                case 'RS': targetLang = 'sr'; break;
                case 'GB':
                case 'US':
                case 'CA':
                case 'AU': targetLang = 'en'; break;
                default: targetLang = 'en'; // Global Default
            }

            console.log(`BRIDGE: Detected ${country}, Target: ${targetLang}`);

            // If detected lang is not TR, and we are at root (which is TR by default)
            if (targetLang !== 'tr') {
                // Redirect
                // But first check if directory exists? 
                // We assume these directories exist based on project structure.

                // Set cookie before redirect to avoid loop
                document.cookie = `${COOKIE_NAME}=${targetLang}; path=/; max-age=31536000`;

                console.log(`BRIDGE: Redirecting to /${targetLang}/`);
                window.location.href = `/${targetLang}/`;
            } else {
                // User is in TR, stayed in TR. Set cookie.
                document.cookie = `${COOKIE_NAME}=tr; path=/; max-age=31536000`;
            }
        })
        .catch(err => {
            console.warn("BRIDGE: Geo check failed.", err);
        });
})();
