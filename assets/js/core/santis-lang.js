/**
 * 🌍 SANTIS CLUB — PHASE 9 SEO & LANG ENGINE (Growth Core)
 * URL + HEAD + STATE = TAM SİSTEM
 */

// 1. STATE LAYER INTEGRATION (Eğer Frontend'de SantisState yoksa, mini bir store)
class LocalState {
    constructor() {
        this.store = { lang: window.__SANTIS_LANG__ || 'tr' };
        this.subscribers = new Set();
    }
    set(key, value) {
        this.store[key] = value;
        this.subscribers.forEach(fn => fn(value));
    }
    subscribe(fn) {
        this.subscribers.add(fn);
        fn(this.store.lang);
        return () => this.subscribers.delete(fn);
    }
}

// Global olarak erişilebilir proxy if Admin State is not present
export const LangState = (window.SantisState && typeof window.SantisState.set === 'function')
    ? {
        set: (k, v) => window.SantisState.set(k, v),
        get: (k) => window.SantisState.get(k) || window.__SANTIS_LANG__ || 'tr',
        subscribe: (k, fn) => window.SantisState.subscribe(k, fn),
        store: { get lang() { return window.__SANTIS_LANG__ || 'tr'; } }
    }
    : new LocalState();

if (LangState instanceof LocalState) {
    LangState.subscribe = (k, fn) => LangState.subscribers.add(fn);
}

// 2. DICTIONARY (TRANSLATION SYSTEM)
const dict = {
    tr: {
        hero: "Spa Deneyimi",
        ritual_btn: "Ritüeli Keşfet",
        philosophy: "Bedeninizi Dinleyin. Sessizliği Biz Sunuyoruz.",
        footer: "© 2026 Santis Club"
    },
    en: {
        hero: "Spa Experience",
        ritual_btn: "Discover the Ritual",
        philosophy: "Listen to Your Body. We Offer the Silence.",
        footer: "© 2026 Santis Club"
    }
};

export function t(key, state = LangState) {
    const lang = typeof state.get === 'function' ? state.get('lang') : state.store.lang;
    return (dict[lang] && dict[lang][key]) ? dict[lang][key] : `[${key}]`;
}

// 3. URL AND STATE SYNC ENGINE
export function switchLang(lang) {
    // History API ile sayfayı yenilemeden URL'i değiştir
    // Sadece /tr/ veya /en/ kısmını değiştir
    const currentPath = window.location.pathname;
    let newPath = currentPath;
    
    if (currentPath.startsWith('/tr/')) {
        newPath = currentPath.replace('/tr/', `/${lang}/`);
    } else if (currentPath.startsWith('/en/')) {
        newPath = currentPath.replace('/en/', `/${lang}/`);
    } else if (currentPath === '/' || currentPath === '/index.html') {
        newPath = `/${lang}/`;
    }
    
    if (newPath !== currentPath) {
        window.history.pushState({}, '', newPath);
    }

    // State güncelle
    if (typeof LangState.set === 'function') {
        LangState.set('lang', lang);
    } else {
        LangState.store.lang = lang;
    }
    window.__SANTIS_LANG__ = lang; // Dışarıya sızdır
    document.documentElement.lang = lang; // A11y

    // Re-render UI Elements
    applyTranslations();
    
    // Legacy Data-Lang Gizleme/Gösterme Desteği
    document.querySelectorAll('[data-lang]').forEach(el => {
        if (el.getAttribute('data-lang') === lang) {
            el.style.display = '';
            el.style.opacity = '1';
        } else {
            el.style.display = 'none';
        }
    });
}

// 4. UI DATA BINDING AUTOMATION
export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Check if element is an input placeholder etc.
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = t(key, LangState);
        } else {
            el.innerHTML = t(key, LangState);
        }
    });
}

// 5. BOOT SEQUENCE
export function initLangEngine() {
    // URL'den dili çıkart, default tr
    const match = window.location.pathname.match(/^\/(tr|en)(\/|$)/);
    const initialLang = match ? match[1] : (window.__SANTIS_LANG__ || 'tr');
    
    if (typeof LangState.set === 'function') {
        LangState.set('lang', initialLang);
    }

    // İlk boot'ta bind yap
    applyTranslations();
    
    // Fallback Legacy
    switchLang(initialLang);

    // Global erişim
    window.SantisLang = { t, switchLang, applyTranslations, dict };
}

// Auto-boot if loaded directly
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(initLangEngine, 50);
    });
}
