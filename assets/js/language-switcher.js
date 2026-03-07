/**
 * SANTIS CLUB - LANGUAGE SWITCHER v2.1 (Optimized)
 * Gizli Google Translate - Bar Yok!
 * 
 * Bu versiyon:
 * - Google Translate bar'ı DOM'dan TAMAMEN KALDIRIR
 * - Cookie ile dil tercihi hatırlar
 * - Özel dropdown dil seçici sunar
 * - PERFORMANCE: Interval ve Observer optimize edildi.
 */

(function () {
    'use strict';

    // 🛑 SINGLETON KORUMASI: Script zaten çalıştıysa tekrar çalışma
    if (window.SANTIS_LANG_ACTIVE) return;
    window.SANTIS_LANG_ACTIVE = true;

    // ═══════════════════════════════════════════════════════════════
    // YAPILANDIRMA
    // ═══════════════════════════════════════════════════════════════

    const CONFIG = {
        enabled: false, // 🛑 GOOGLE TRANSLATE DISABLED BY USER REQUEST
        // Popüler Diller (Dropdown'da görünür)
        languages: [
            { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'ru', name: 'Русский', flag: '🇷🇺' },
            { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'it', name: 'Italiano', flag: '🇮🇹' },
            { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' }
        ],
        defaultLang: 'tr',
        cookieName: 'santis_lang'
    };

    // ═══════════════════════════════════════════════════════════════
    // BAR ÖLDÜRÜCÜ - EN AGRESİF VERSİYON
    // ═══════════════════════════════════════════════════════════════

    function killGoogleBar() {
        // Body henüz yüklenmediyse çık
        if (!document.body) return;

        // 3. Tüm Google Translate elementlerini DOM'dan SİL (Güvenli Mod: Gizle)
        const selectors = [
            'iframe.goog-te-banner-frame',
            '.goog-te-banner-frame',
            '#goog-gt-tt',
            '.goog-te-balloon-frame',
            'iframe[src*="translate.google"]'
        ];

        selectors.forEach(sel => {
            const els = document.querySelectorAll(sel);
            if (els.length > 0) {
                els.forEach(el => {
                    if (el.style.display !== 'none') {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                        el.style.pointerEvents = 'none';
                    }
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // CSS ENJEKSİYONU - HER ŞEYI GİZLE
    // ═══════════════════════════════════════════════════════════════

    function injectKillerCSS() {
        if (document.getElementById('santis-translate-killer')) return;

        const style = document.createElement('style');
        style.id = 'santis-translate-killer';
        style.textContent = `
            /* GOOGLE TRANSLATE - MUTLAK GİZLEME */
            .goog-te-banner-frame,
            iframe.goog-te-banner-frame,
            #goog-gt-tt,
            .goog-te-balloon-frame,
            .goog-te-gadget,
            iframe[src*="translate.google"] {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
            }
            
            /* BODY DÜZELTME - KRİTİK */
            body, html {
                top: 0 !important;
                margin-top: 0 !important;
                position: static !important;
            }
            
            html.translated-ltr,
            html.translated-rtl,
            html.translated-ltr body,
            html.translated-rtl body {
                top: 0 !important;
                margin-top: 0 !important;
                position: static !important;
                min-height: 100% !important;
                transform: none !important;
            }
            
            /* GOOGLE TRANSLATE ELEMENT - GİZLİ */
            #google_translate_element {
                position: fixed !important;
                bottom: -9999px !important;
                left: -9999px !important;
                height: 1px !important;
                width: 1px !important;
                overflow: hidden !important;
                opacity: 0 !important;
            }
            
            /* SANTIS DROPDOWN STİLLERİ */
            .santis-lang-dropdown { position: relative; z-index: 99999; }
            .santis-lang-btn {
                display: flex; align-items: center; gap: 6px; padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px; color: #fff; cursor: pointer; font-size: 14px; transition: all 0.2s;
            }
            .santis-lang-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(212, 175, 55, 0.5); }
            .santis-lang-flag { font-size: 16px; }
            .santis-lang-code { font-weight: 500; letter-spacing: 0.5px; }
            .santis-lang-arrow { font-size: 10px; opacity: 0.6; transition: transform 0.2s; }
            .santis-lang-dropdown:hover .santis-lang-arrow { transform: rotate(180deg); }
            
            .santis-lang-menu {
                position: absolute; top: calc(100% + 8px); right: 0; min-width: 160px;
                background: rgba(15, 15, 15, 0.98); backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 6px;
                opacity: 0; visibility: hidden; transform: translateY(-10px); transition: all 0.2s;
                max-height: 320px; overflow-y: auto;
            }
            .santis-lang-dropdown:hover .santis-lang-menu { opacity: 1; visibility: visible; transform: translateY(0); }
            
            .santis-lang-option {
                display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px;
                background: transparent; border: none; color: rgba(255, 255, 255, 0.7);
                cursor: pointer; border-radius: 6px; transition: all 0.15s; text-align: left; font-size: 13px;
            }
            .santis-lang-option:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
            .santis-lang-option.active { background: rgba(212, 175, 55, 0.15); color: #d4af37; }
            
            .santis-lang-menu::-webkit-scrollbar { width: 4px; }
            .santis-lang-menu::-webkit-scrollbar-track { background: transparent; }
            .santis-lang-menu::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        `;
        document.head.appendChild(style);
    }

    // ═══════════════════════════════════════════════════════════════
    // GOOGLE TRANSLATE YÜKLE (GECİKMELİ)
    // ═══════════════════════════════════════════════════════════════

    function loadGoogleTranslate() {
        const container = document.createElement('div');
        container.id = 'google_translate_element';
        document.body.appendChild(container);

        window.googleTranslateElementInit = function () {
            new google.translate.TranslateElement({
                pageLanguage: 'tr',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');

            // Bar kill attempts (finite)
            setTimeout(killGoogleBar, 500);
            setTimeout(killGoogleBar, 1000);
            setTimeout(killGoogleBar, 2000);
            setTimeout(killGoogleBar, 5000);
        };

        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.defer = true; // Optimization
        document.head.appendChild(script);
    }

    // ═══════════════════════════════════════════════════════════════
    // DİL DEĞİŞTİRME (Omni-Language Protocol'e Bağlandı)
    // ═══════════════════════════════════════════════════════════════

    function changeLanguage(langCode) {
        // Eski cookie reload yerine Omni-Language Protocol (Stateful Routing) kullanıyoruz
        if (typeof window.SantisRouter !== 'undefined' && typeof window.SantisRouter.translate === 'function') {
            const currentPath = window.location.pathname;
            const newPath = window.SantisRouter.translate(currentPath, langCode);

            // Dil cookie'sini her ihtimale karşı güncelle
            document.cookie = `santis_lang=${langCode}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem('santis_lang', langCode);

            // Eğer çevrilmiş yol mevcutsa oraya, değilse seçilen dilin home page'ine git
            if (newPath && newPath !== currentPath) {
                window.location.href = newPath;
            } else {
                // Fallback (örneğin o dilde sayfa yoksa ana sayfasına git)
                window.location.href = `/${langCode}/index.html`;
            }
        } else if (typeof window.setLang === 'function') {
            window.setLang(langCode);
        } else {
            console.warn('⚠️ [Santis Lang] Router not found. Falling back to simple generic reload.');
            document.cookie = `googtrans=/tr/${langCode}; path=/`;
            document.cookie = `googtrans=/tr/${langCode}; path=/; domain=${location.hostname}`;
            document.cookie = `santis_lang=${langCode}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem('santis_lang', langCode);
            location.reload();
        }

        // Dropdown UI'ı yenile (Aktif dili güncellemek için)
        insertDropdown();
    }

    function getCurrentLang() {
        if (window.SantisOmniLang) {
            return window.SantisOmniLang.currentLang;
        }
        // Fallback or initialization
        const match = document.cookie.match(/googtrans=\/tr\/(\w+)/);
        return localStorage.getItem('santis_lang') || (match ? match[1] : 'tr');
    }

    // ═══════════════════════════════════════════════════════════════
    // DROPDOWN OLUŞTUR
    // ═══════════════════════════════════════════════════════════════

    function createDropdown() {
        const currentLang = getCurrentLang();
        const current = CONFIG.languages.find(l => l.code === currentLang) || CONFIG.languages[0];

        const dropdown = document.createElement('div');
        dropdown.className = 'santis-lang-dropdown skiptranslate';
        dropdown.innerHTML = `
            <button class="santis-lang-btn" aria-label="Dil Seçin">
                <span class="santis-lang-flag">${current.flag}</span>
                <span class="santis-lang-code">${currentLang.toUpperCase()}</span>
                <span class="santis-lang-arrow">▼</span>
            </button>
            <div class="santis-lang-menu">
                ${CONFIG.languages.map(lang => `
                    <button class="santis-lang-option ${lang.code === currentLang ? 'active' : ''}" 
                            data-lang="${lang.code}">
                        <span class="santis-lang-flag">${lang.flag}</span>
                        <span>${lang.name}</span>
                    </button>
                `).join('')}
            </div>
        `;

        dropdown.querySelectorAll('.santis-lang-option').forEach(btn => {
            btn.addEventListener('click', () => {
                changeLanguage(btn.dataset.lang);
            });
        });

        return dropdown;
    }

    function insertDropdown() {
        let dropdown = document.querySelector('.santis-lang-dropdown');
        if (!dropdown) {
            dropdown = createDropdown();
        }

        // 1. New Standard (Root)
        const placeholder = document.getElementById('santis-language-root');
        if (placeholder) {
            placeholder.innerHTML = '';
            placeholder.appendChild(dropdown);
            return;
        }

        // 2. Fallbacks...
        const navActions = document.querySelector('.nav-actions, .navbar-actions, header nav');
        if (navActions) {
            navActions.appendChild(dropdown);
            return;
        }

        if (!dropdown.parentNode) {
            const header = document.querySelector('header');
            if (header) {
                header.appendChild(dropdown);
            } else {
                document.body.appendChild(dropdown);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BAŞLATICI
    // ═══════════════════════════════════════════════════════════════

    function init() {
        injectKillerCSS();

        // Initial cleanups (Finite)
        killGoogleBar();
        setTimeout(killGoogleBar, 500);

        // Optimized MutationObserver - Only check BODY direct additions
        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                let check = false;
                for (const m of mutations) {
                    if (m.addedNodes.length > 0) { check = true; break; }
                }
                if (check) killGoogleBar();
            });

            if (document.body) {
                observer.observe(document.body, { childList: true });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true });
                });
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }
    }

    function onReady() {
        insertDropdown();
        // Delay translation load to prioritize core interactivity
        if (CONFIG.enabled) {
            setTimeout(loadGoogleTranslate, 2500);
        } else {
            console.log('🛑 [Lang] Google Translate is disabled in config.');
        }
        console.log('🌐 Santis Language Switcher v2.1 (Optimized) active');
    }

    init();

    window.SANTIS_LANG = {
        change: changeLanguage,
        current: getCurrentLang,
        languages: CONFIG.languages,
        refresh: insertDropdown
    };

})();
