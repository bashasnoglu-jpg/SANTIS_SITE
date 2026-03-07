/**
 * SANTIS LANGUAGE SYNC (Omni-Language Protocol V1.0)
 * --------------------------------------------------
 * "data-lang" mimarisiyle sayfayı yenilemeden tek dosya üzerinden (TR/EN) 
 * anlık dil değişimi sağlar.
 */

(function () {
    'use strict';

    window.SantisOmniLang = {
        currentLang: 'tr',

        init: function () {
            // Get lang from local storage or URL or HTML tag
            const storedLang = localStorage.getItem('santis_lang');
            const htmlLang = document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'tr';

            this.currentLang = storedLang || htmlLang;

            // Apply initial
            this.setLang(this.currentLang, true);
        },

        setLang: function (lang, isInit = false) {
            this.currentLang = lang;
            localStorage.setItem('santis_lang', lang);
            document.documentElement.setAttribute('data-lang', lang);
            document.documentElement.lang = lang;

            console.log(`🌍 [OmniLang] Switched to: ${lang}`);

            // 1. Text Switcher (<span data-lang="en">...</span>)
            const langElements = document.querySelectorAll('[data-lang]');

            langElements.forEach(el => {
                // Ignore the root HTML element
                if (el.tagName.toLowerCase() === 'html') return;

                const elLang = el.getAttribute('data-lang');

                if (elLang === lang) {
                    el.style.display = ''; // Revert to default display (inline/block etc)
                } else {
                    el.style.display = 'none';
                }
            });

            // 2. Head Tags (Title & Meta) update if they have data-lang
            const titleEl = document.querySelector(`title[data-lang="${lang}"]`);
            if (titleEl) document.title = titleEl.textContent;

            const descEl = document.querySelector(`meta[name="description"][data-lang="${lang}"]`);
            if (descEl) {
                const currentDesc = document.querySelector('meta[name="description"]:not([data-lang])');
                if (currentDesc) currentDesc.setAttribute('content', descEl.getAttribute('content'));
            }

            // 3. Optional: Trigger a custom event for other modules
            if (!isInit) {
                window.dispatchEvent(new CustomEvent('santis:lang-changed', { detail: { lang } }));
            }
        },

        toggle: function () {
            const next = this.currentLang === 'tr' ? 'en' : 'tr';
            this.setLang(next);
        }
    };

    // Expose global method exactly as requested in prompt "NEUROVA_TR_EN_BIREBIR_SYNC"
    window.setLang = function (lang) {
        window.SantisOmniLang.setLang(lang);
    };

    // Auto-init
    document.addEventListener('DOMContentLoaded', () => {
        window.SantisOmniLang.init();
    });

})();
