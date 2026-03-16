/**
 * SANTIS OS - Sovereign i18n Matrix (Language Core Engine)
 * Version: 3.0 (God Architecture v3)
 * Description: Otonom DOM çevirici, no-refresh experience ve Neural Router bağlayıcı.
 */

class SovereignMatrix {
    constructor() {
        this.currentLang = localStorage.getItem('santis_lang') || 'tr';
        this.i18nData = null;
        this.jsonPath = '/assets/data/i18n.json';
        this.init();
    }

    async init() {
        try {
            const response = await fetch(this.jsonPath);
            if (!response.ok) throw new Error('Polyglot Matrix (i18n.json) failed to load!');
            this.i18nData = await response.json();

            console.log(`[SovereignMatrix] Matrix Loaded. Breathing in [${this.currentLang.toUpperCase()}]`);
            this.translateDOM();
            this.bindLanguageToggles();
            this.injectHreflangTags();
        } catch (error) {
            console.error('[SovereignMatrix] Critical Error:', error);
        }
    }

    translateDOM(lang = this.currentLang) {
        if (!this.i18nData) return;

        // 1. data-i18n niteliğine sahip öğelerin çevirisi (örn: data-i18n="nav.home")
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const keyPath = el.getAttribute('data-i18n');
            const translation = this.getValueByPath(this.i18nData, `${keyPath}.${lang}`);

            if (translation) {
                // Eğer input veya textarea ise placeholder değişmeli
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.innerHTML = translation;
                }
            } else {
                console.warn(`[SovereignMatrix] Missing translation key for [${lang}]: ${keyPath}`);
            }
        });

        // 2. data-lang niteliğini root <html> içine entegre et
        document.documentElement.lang = lang;
        document.documentElement.setAttribute('data-lang', lang);

        // 3. Meta Data Çevirileri
        const metaDesc = this.getValueByPath(this.i18nData, `meta.description.${lang}`);
        if (metaDesc) {
            let metaTag = document.querySelector('meta[name="description"]');
            if (metaTag) {
                metaTag.setAttribute('content', metaDesc);
            }
        }

        // 4. Dispatch a custom event for other modules
        document.dispatchEvent(new CustomEvent('santisLanguageChanged', { detail: { lang } }));
    }

    switchLanguage(lang) {
        if (!['tr', 'en', 'de', 'fr', 'ru'].includes(lang)) return;

        this.currentLang = lang;
        localStorage.setItem('santis_lang', lang);

        this.translateDOM(lang);
        this.injectHreflangTags();
        console.log(`[SovereignMatrix] Context Switched to -> ${lang.toUpperCase()}`);
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    bindLanguageToggles() {
        document.querySelectorAll('.lang-btn, [data-lang-switch]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetLang = btn.getAttribute('data-lang-switch');
                if (targetLang) this.switchLanguage(targetLang);
            });
        });
    }

    injectHreflangTags() {
        // Eski hreflang taglerini sil
        document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

        const protocols = ['tr', 'en', 'de', 'fr', 'ru'];
        // Gerçek projede 'window.location.origin' yerine sabit domain girilmeli.
        const origin = window.location.origin;
        const currentPath = window.location.pathname; // (Rotalar Neural Router'a geçtiğinde burası değişecek)

        protocols.forEach(p => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = p;
            // Route yönlendirme tablosu (routes.json) entegre edildiğinde tam yol dönüştürülecek.
            link.href = `${origin}/${p}${currentPath.substring(3)}`; // Basit bir /tr -> /en kesmesi
            document.head.appendChild(link);
        });
    }
}

// OS Boot sequence
document.addEventListener('DOMContentLoaded', () => {
    window.santisMatrix = new SovereignMatrix();
});
