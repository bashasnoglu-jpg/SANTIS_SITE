/**
 * SANTIS CLUB - LANGUAGE SWITCHER v2.0
 * Gizli Google Translate - Bar Yok!
 * 
 * Bu versiyon:
 * - Google Translate bar'ı DOM'dan TAMAMEN KALDIRIR
 * - Cookie ile dil tercihi hatırlar
 * - Özel dropdown dil seçici sunar
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

        // TEHLİKELİ KOD KALDIRILDI: document.body.style.cssText müdahalesi iptal.
        // CSS enjeksiyonu zaten bu işi yapıyor.

        // 3. Tüm Google Translate elementlerini DOM'dan SİL (Güvenli Mod: Gizle)
        const selectors = [
            'iframe.goog-te-banner-frame',
            '.goog-te-banner-frame',
            '#goog-gt-tt',
            '.goog-te-balloon-frame',
            'iframe[src*="translate.google"]'
        ];

        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.pointerEvents = 'none';
            });
        });
    }

    // ... (injectKillerCSS vb. aynı kalıyor) ...

    function init() {
        // 1. CSS enjekte et (Hemen çalışsın, zararı yok)
        injectKillerCSS();

        // 2. Bar öldürücüyü sürekli çalıştır
        setInterval(killGoogleBar, 500);

        // 3. MutationObserver
        const observer = new MutationObserver(killGoogleBar);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // 4. KRİTİK DEĞİŞİKLİK: Google Translate'i GECİKMELİ yükle
        // Sayfa tamamen açıldıktan 3 saniye sonra.
        const startTranslate = () => {
            console.log('⏳ Google Translate yükleniyor...');
            setTimeout(onReady, 2000); // 2 saniye rölanti
        };

        if (document.readyState === 'complete') {
            startTranslate();
        } else {
            window.addEventListener('load', startTranslate);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CSS ENJEKSİYONU - HER ŞEYI GİZLE
    // ═══════════════════════════════════════════════════════════════

    function injectKillerCSS() {
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

            /* ═══════════════════════════════════════════════════════════════ */
            /* SANTIS DROPDOWN STİLLERİ */
            /* ═══════════════════════════════════════════════════════════════ */
            
            .santis-lang-dropdown {
                position: relative;
                z-index: 99999;
            }
            
            .santis-lang-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .santis-lang-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(212, 175, 55, 0.5);
            }
            
            .santis-lang-flag { font-size: 16px; }
            .santis-lang-code { font-weight: 500; letter-spacing: 0.5px; }
            .santis-lang-arrow { font-size: 10px; opacity: 0.6; transition: transform 0.2s; }
            
            .santis-lang-dropdown:hover .santis-lang-arrow { transform: rotate(180deg); }
            
            .santis-lang-menu {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                min-width: 160px;
                background: rgba(15, 15, 15, 0.98);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 6px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s;
                max-height: 320px;
                overflow-y: auto;
            }
            
            .santis-lang-dropdown:hover .santis-lang-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .santis-lang-option {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.15s;
                text-align: left;
                font-size: 13px;
            }
            
            .santis-lang-option:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
            }
            
            .santis-lang-option.active {
                background: rgba(212, 175, 55, 0.15);
                color: #d4af37;
            }
            
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
        // Container oluştur (gizli)
        const container = document.createElement('div');
        container.id = 'google_translate_element';
        document.body.appendChild(container);

        // Init fonksiyonu
        window.googleTranslateElementInit = function () {
            new google.translate.TranslateElement({
                pageLanguage: 'tr',
                // includedLanguages parametresi kaldırılarak TÜM diller aktif edildi (100+)
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');

            // Widget yüklendikten 500ms sonra bar'ı öldür
            setTimeout(killGoogleBar, 500);
            setTimeout(killGoogleBar, 1000);
            setTimeout(killGoogleBar, 2000);
        };

        // Script yükle
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
    }

    // ═══════════════════════════════════════════════════════════════
    // DİL DEĞİŞTİRME
    // ═══════════════════════════════════════════════════════════════

    function changeLanguage(langCode) {
        // Cookie kaydet
        document.cookie = `googtrans=/tr/${langCode}; path=/`;
        document.cookie = `googtrans=/tr/${langCode}; path=/; domain=${location.hostname}`;

        // Sayfa yenile
        location.reload();
    }

    function getCurrentLang() {
        const match = document.cookie.match(/googtrans=\/tr\/(\w+)/);
        return match ? match[1] : 'tr';
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

        // Event listeners
        dropdown.querySelectorAll('.santis-lang-option').forEach(btn => {
            btn.addEventListener('click', () => {
                changeLanguage(btn.dataset.lang);
            });
        });

        return dropdown;
    }

    function insertDropdown() {
        // Zaten varsa ekleme!
        if (document.querySelector('.santis-lang-dropdown')) return;

        const dropdown = createDropdown();

        // 1. Navbar'daki placeholder'a ekle (Yeni Standart)
        const placeholder = document.getElementById('santis-language-root');
        if (placeholder) {
            placeholder.innerHTML = ''; // Temizle
            placeholder.appendChild(dropdown);
            return;
        }

        // 2. Fallback: Navbar actions
        const navActions = document.querySelector('.nav-actions, .navbar-actions, header nav');
        if (navActions) {
            navActions.appendChild(dropdown);
            return;
        }

        // 3. Fallback: Header
        const header = document.querySelector('header, nav');
        if (header) {
            header.style.position = 'relative';
            dropdown.style.position = 'absolute';
            dropdown.style.right = '20px';
            dropdown.style.top = '50%';
            dropdown.style.transform = 'translateY(-50%)';
            header.appendChild(dropdown);
            return;
        }

        // 4. Last Resort: Body Fixed
        dropdown.style.position = 'fixed';
        dropdown.style.right = '20px';
        dropdown.style.top = '20px';
        document.body.appendChild(dropdown);
    }

    // ═══════════════════════════════════════════════════════════════
    // BAŞLATICI
    // ═══════════════════════════════════════════════════════════════

    function init() {
        // 1. CSS enjekte et
        injectKillerCSS();

        // 2. Bar öldürücüyü sürekli çalıştır
        killGoogleBar();
        setInterval(killGoogleBar, 200); // Her 200ms'de kontrol

        // 3. MutationObserver
        const observer = new MutationObserver(killGoogleBar);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // 4. DOM hazır olunca
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }
    }

    function onReady() {
        insertDropdown();
        loadGoogleTranslate();
        console.log('🌐 Santis Language Switcher v2.0 aktif (bar yok!)');
    }

    // Başlat
    init();

    // Global API
    window.SANTIS_LANG = {
        change: changeLanguage,
        current: getCurrentLang,
        languages: CONFIG.languages
    };

})();
