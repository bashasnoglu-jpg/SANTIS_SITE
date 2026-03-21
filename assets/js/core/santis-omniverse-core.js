/**
 * SANTIS OS - OMNIVERSE CORE [PHASE 37]
 * Single Source of Truth, Zero-Load Translation & SEO Awakening
 * Architect: Hakan
 */

class SantisOmniverseCore {
    constructor() {
        this.supportedLangs = ['tr', 'en'];
        this.defaultLang = 'tr';
    }

    boot() {
        // 1. Misafirin Niyetini (Dilini) Sez
        const targetLang = this.detectLanguage();
        
        console.log(`🌍 [Omniverse Core] NEUROVA_TR_EN_BIREBIR_SYNC Uyandı. Kuantum Boyutu: [${targetLang.toUpperCase()}]`);
        
        // 2. Matrisi Otonom Olarak Şekillendir
        this.shiftDimension(targetLang, true);
        
        // 3. Arayüz Tetikleyicilerini Dinle
        this.bindTriggers();
    }

    detectLanguage() {
        // Öncelik 1: URL Parametresi (Örn: site.com/bronz-masaji?lang=en)
        const params = new URLSearchParams(window.location.search);
        if (params.has('lang') && this.supportedLangs.includes(params.get('lang'))) return params.get('lang');
        
        // Öncelik 2: Phase 34 Emotional Cache / LocalStorage
        const cached = localStorage.getItem('santis_neurova_lang');
        if (cached && this.supportedLangs.includes(cached)) return cached;

        // Öncelik 3: Tarayıcı Biyometrisi (İşletim sistemi dili)
        const browserLang = navigator.language.slice(0, 2);
        if (this.supportedLangs.includes(browserLang)) return browserLang;

        return this.defaultLang;
    }

    shiftDimension(targetLang, isBoot = false) {
        if (!isBoot && targetLang === document.documentElement.lang) return;

        console.log(`🌀 [Omniverse] Matris Dili Kırılıyor... Yeni Frekans: ${targetLang.toUpperCase()}`);

        // Geçiş efekti için CSS tetikleyicisini ekle
        document.body.classList.add('santis-lang-shifting');

        // Zero-Jank: DOM manipülasyonunu frame'e hizala
        requestAnimationFrame(() => {
            // 🚨 KUANTUM MÜHRÜ: HTML lang değiştiği an CSS Zırhı devreye girer. YENİLEME YOK!
            document.documentElement.lang = targetLang;
            localStorage.setItem('santis_neurova_lang', targetLang);

            // 🔴 KRİTİK 2 ÇÖZÜMÜ: Uyuyan SEO Motorlarını Güncelle
            this.awakenSEOMotors(targetLang);

            if (!isBoot) {
                // Zero-Reload URL Değişimi (History API)
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('lang', targetLang);
                window.history.replaceState({}, '', newUrl);

                // Haptic Feedback (Phase 34 Donanımsal Titreşim)
                if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
            }

            // Merkezi Sinir Sistemine (Aurelia AI ve diğer modüllere) fısılda
            if (window.SantisEventBus) {
                window.SantisEventBus.emit('omniverse:language_shifted', targetLang);
                // Grid Matrisini hizala (Phase 30.5)
                setTimeout(() => window.SantisEventBus.emit('matrix:recalculate'), 50);
            }

            // Efekti temizle
            setTimeout(() => document.body.classList.remove('santis-lang-shifting'), 500);
        });
    }

    // 🔴 KRİTİK 2 ÇÖZÜMÜ: UYUYAN SEO MOTORLARININ UYANIŞI
    awakenSEOMotors(lang) {
        console.log("🕸️ [Sovereign SEO] Kuantum Örümcekleri Devrede: Hreflang, Canonical & Schema Güncelleniyor.");
        const baseUrl = window.location.origin + window.location.pathname;

        // 1. Canonical Etiketi
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = lang === this.defaultLang ? baseUrl : `${baseUrl}?lang=${lang}`;

        // 2. Hreflang Etiketleri (Çoklu Evren Sinyali)
        this.supportedLangs.forEach(l => {
            let hreflang = document.querySelector(`link[hreflang="${l}"]`);
            if (!hreflang) {
                hreflang = document.createElement('link');
                hreflang.rel = 'alternate';
                hreflang.hreflang = l;
                document.head.appendChild(hreflang);
            }
            hreflang.href = l === this.defaultLang ? baseUrl : `${baseUrl}?lang=${l}`;
        });

        // 3. Schema.org Enjeksiyonu
        this.injectSchema(lang);
    }

    injectSchema(lang) {
        const schemaId = 'santis-quantum-schema';
        let script = document.getElementById(schemaId);
        if (script) script.remove();

        script = document.createElement('script');
        script.id = schemaId;
        script.type = 'application/ld+json';
        
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "HealthAndBeautyBusiness",
            "name": "Santis Sovereign Spa",
            "image": "https://santis.os/assets/img/vanta-gold-logo.jpg",
            "priceRange": "$$$$",
            "description": lang === 'tr' 
                ? "Sessiz lüksün ve biyometrik arınmanın Kuantum sığınağı." 
                : "The Quantum sanctuary of quiet luxury and biometric purification."
        };

        script.textContent = JSON.stringify(schemaData);
        document.head.appendChild(script);
    }

    bindTriggers() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-neurova-lang]');
            if (btn) {
                e.preventDefault();
                this.shiftDimension(btn.getAttribute('data-neurova-lang'));
            }
        });
    }
}

// Çekirdeği Ateşle
function initOmniverseMatrix() {
    window.SantisOmniverse = new SantisOmniverseCore();
    window.SantisOmniverse.boot();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOmniverseMatrix);
} else {
    initOmniverseMatrix();
}
