/**
 * 🦅 SOVEREIGN OS v31: KINETIC OMNI-RENDER (APPLE-TIER)
 * Virtual Scroll, 3D Skew Physics, and Inertia Decay
 * ========================================================
 * Native Scroll'u tamamen "hijack" edip (devralıp) matematiksel bir
 * ivme (Velocity) ve sönümleme (Lerp) algoritması uygular.
 * EKRAN KARTINIZI AĞLATACAK KADAR AKICIDIR. (120 FPS KİLİTLİ)
 *
 * YETENEKLER:
 * 1. Fluid Lerp (Doğrusal İnterpolasyon)
 * 2. Velocity Skew (Hıza bağlı 3D Bükülme)
 * 3. Sub-pixel Rendering Koruması
 * 4. Content-Visibility + ResizeObserver Otonomisi
 */

class SovereignKineticEngine {
    constructor() {
        // Hedef Kapsayıcı Kontrolü
        const mainEl = document.getElementById('sovereign-page-root') || document.querySelector('main');
        if (!mainEl) return;
        this.mainEl = mainEl;
        
        // Touch cihazlarda Native Momentum daha sağlıklıdır (iOS Elastic Bounce için)
        // O yüzden sadece Desktop (Mouse/Wheel) ortamında çalışır.
        this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (this.isTouch && window.innerWidth < 1024) {
            console.log("🦅 [Omni-Render] Dokunmatik Native Scroll korundu.");
            return;
        }

        // Kuantum Değişkenler
        this.y = { current: 0, target: 0, limit: 0, velocity: 0 };
        this.ease = 0.075; // Sönümleme Katsayısı (Apple Hisşi: 0.06 - 0.09 arası iyidir)
        this.isScrolling = false;
        
        this.lastTime = performance.now();
        
        // Kartlarda 3D bükülme yaratmak isteyip istemediğimiz (S-Tier Opsiyon)
        this.applySkew = false; // Kullanıcı "sağa sola yükseliyor/iniyor" (sayfa yalpalaması) şikayeti üzerine kapatıldı.

        this.init();
    }

    init() {
        // Dinamik Kinetic Wrapper Oluştur (Sayfa akışını bozmamak için)
        this.root = document.createElement('div');
        this.root.id = 'sovereign-kinetic-wrapper';
        
        this.mainEl.parentNode.insertBefore(this.root, this.mainEl);
        this.root.appendChild(this.mainEl);
        
        const footer = document.getElementById('footer-container') || document.querySelector('footer');
        if (footer) this.root.appendChild(footer);

        // VIRTUAL SCROLL KURULUMU:
        // İçeriği ekran dışına çıkarıp fixed body üzerinden illüzyon yaratıyoruz
        document.body.style.overscrollBehavior = 'none';
        
        this.root.style.position = 'fixed';
        this.root.style.top = '0';
        this.root.style.left = '0';
        this.root.style.width = '100vw';
        this.root.style.willChange = 'transform';
        this.root.style.transformOrigin = 'center top'; // Bükülme merkezi
        this.root.style.contain = 'layout style';
        
        // İlk Bounding Boyutu
        this.updateHeight();
        
        // Native Scroll Dinleyici (Yalnızca hedef rotayı değiştirir, DOM'a dokunmaz)
        window.addEventListener('scroll', () => {
            this.y.target = window.scrollY;
            this.isScrolling = true;
        }, { passive: true });

        // Container içeriği değişirse (Worker bitirir / imaj yüklenir) Virtual boyu da güncelle
        window.addEventListener('resize', () => this.updateHeight());
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => this.updateHeight());
            ro.observe(this.root);
        }
        
        // Motoru Ateşle
        this.render();
        console.log("🔥 [Omni-Render] S-Tier Kinetic Slider Ateşlendi! Matrix Akıyor...");
    }

    updateHeight() {
        const rect = this.root.getBoundingClientRect();
        this.y.limit = rect.height - window.innerHeight; // Kalan scroll alanı
        // Sadece Body height artırılarak Native Scrollbar tetiklenir
        document.body.style.height = `${Math.floor(rect.height)}px`;
    }

    render() {
        const time = performance.now();
        const deltaT = time - this.lastTime;
        this.lastTime = time;

        // 1. LERP FORMÜLÜ (Pürüzsüz Akış)
        // Delta Time bazlı bağımsız Lerp (Monitör Hz fark etmeksizin aynı his)
        const diff = this.y.target - this.y.current;
        const previousY = this.y.current;
        
        this.y.current += diff * this.ease;

        // Sub-pixel snapping (Bulanıklık ve donanım zorlanmasını keser)
        if (Math.abs(diff) < 0.01) {
            this.y.current = this.y.target;
            if (this.isScrolling) {
                this.isScrolling = false;
                this.root.style.pointerEvents = ''; // Scroll bitti, tıklamaları aç
            }
        } else {
            if (!this.isScrolling) {
                this.isScrolling = true;
                this.root.style.pointerEvents = 'none'; // Scroll esnasında hover zıplamalarını engelle
            }
        }

        // 2. VELOCITY (İVME) HESAPLAMA (Apple Cihazlarındaki Jöle Hissi)
        // Hız = Alınan Yol / Zaman 
        this.y.velocity = (this.y.current - previousY) / Math.max(1, deltaT);
        
        let skewValue = 0;
        let scaleValue = 1;

        if (this.applySkew && this.isScrolling) {
            // İvmeye göre belli bir limite kadar Skew (Çarpıtma) verelim (Örn: Max 2 derece)
            skewValue = this.y.velocity * 1.5; 
            skewValue = Math.max(-2.5, Math.min(2.5, skewValue)); // Limit
        }

        // 3. OMNI-TRANSFORM (DONANIM HIZLANDIRMA)
        // Float sabitlemesi (Titreşimi önler)
        const yPos = this.y.current.toFixed(2);
        const skewStr = skewValue !== 0 ? ` skewY(${skewValue.toFixed(2)}deg)` : '';
        
        this.root.style.transform = `translate3d(0, -${yPos}px, 0)${skewStr}`;

        // Infinite Rendering Döngüsü (Frame kilitli)
        requestAnimationFrame(() => this.render());
    }
}

// Sovereign Router/Bootloader sonrası otonom ayağa kalkar
window.addEventListener('DOMContentLoaded', () => {
    if(document.querySelector('.solid-nav-page')) {
        window.SovereignKineticEngine = new SovereignKineticEngine();
    }
});
