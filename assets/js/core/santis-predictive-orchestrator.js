/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - PREDICTIVE ORCHESTRATOR v1.0 (Phase 43/44)
 * ═══════════════════════════════════════════════════════════
 * Kognitif Radar: Sadece sürtünmeyi (friction) biriktirmez, 
 * imleç ve kaydırma hareketlerinin ivme (acceleration) ve 
 * yörüngesini (trajectory) anlık ölçerek krizi *öngörür*.
 */

class SantisPredictiveOrchestrator {
    constructor() {
        this.isPredicted = false;
        this.microHesitationTimer = null;

        // Kuantum Çekirdeği (Worker) Bağlantısı (Phase 46)
        this.initCognitiveWorker();

        console.log("🔮 [Predictive Orchestrator] Kognitif Radar Aktif. Yük Worker'a devredildi.");
        this.bindEvents();
    }

    initCognitiveWorker() {
        try {
            if (!window.__oracleWorker) {
                window.__oracleWorker = new Worker('/assets/js/workers/santis-cognitive-worker.js');
            }
            this.worker = window.__oracleWorker;
            this.worker.postMessage({ type: 'INIT', timestamp: performance.now() });

            this.worker.onmessage = (e) => {
                if (e.data.type === 'STRESS_ALERT_PREDICTED' && !this.isPredicted) {
                    this.triggerErkenUyari(e.data.reason);
                }
            };
        } catch (err) {
            console.error("Worker başlatılamadı, fallback aktif edilecek.", err);
        }
    }

    bindEvents() {
        // MOUSE KİNEMATİĞİ (İvme ve Yörünge)
        document.addEventListener('mousemove', (e) => this.calculateMouseKinematics(e), { passive: true });
        
        // SCROLL KİNEMATİĞİ (Agresyon)
        document.addEventListener('scroll', () => this.calculateScrollKinematics(), { passive: true });
        
        // MICRO-HESITATIONS (Hover olup tıklamamalar)
        document.querySelectorAll('a.santis-btn, .bento-card-v6').forEach(el => {
            el.addEventListener('mouseenter', () => this.startHesitationTracker(el));
            el.addEventListener('mouseleave', () => this.stopHesitationTracker());
            el.addEventListener('click', () => this.stopHesitationTracker(true));
        });
    }

    calculateMouseKinematics(e) {
        if (this.isPredicted || !this.worker) return;
        
        this.worker.postMessage({
            type: 'KINEMATIC_TICK',
            payload: { x: e.clientX, y: e.clientY, timestamp: performance.now() }
        });
    }

    calculateScrollKinematics() {
        if (this.isPredicted || !this.worker) return;

        this.worker.postMessage({
            type: 'KINEMATIC_TICK',
            payload: { scrollY: window.scrollY, timestamp: performance.now() }
        });
    }

    startHesitationTracker(el) {
        this.microHesitationTimer = setTimeout(() => {
            // İmleç 2.5 saniye boyunca kritik bir CTA üzerinde kaldı ancak tıklanmadı
            if (!this.isPredicted) {
                this.triggerErkenUyari(`Micro-Hesitation on Target: ${el.tagName.toLowerCase()}`);
            }
        }, 2500);
    }

    stopHesitationTracker(wasClicked = false) {
        clearTimeout(this.microHesitationTimer);
        // Eğer tıklandıysa stresi düşür (Kararlılık)
        if (wasClicked && window.SantisFrictionEngine) {
            // SantisFrictionEngine.decreaseScore(10) gibi bir metot çağrılabilir.
        }
    }

    triggerErkenUyari(reason) {
        // Friction Score henüz 70 değil (belki 40), ancak sistem yörüngenin kriz olduğunu öngörüyor.
        this.isPredicted = true;
        console.warn(`🔮 [Predictive Orchestrator] ERKEN UYARI! Yörünge Krizi Bekleniyor. Sebep: ${reason}`);
        
        // 1. Kinetik Sönümleme (Kinetic Damping) - Arayüzü Yavaşlat ve Sakinleştir
        document.documentElement.style.setProperty('--ease-santis', 'cubic-bezier(0.4, 0, 0.2, 1)'); 
        // Global geçişleri yavaşlatan bir stil basımı:
        const style = document.createElement('style');
        style.innerHTML = `* { transition-duration: 1.2s !important; }`;
        document.head.appendChild(style);
        console.log("🧘 [Orchestrator] Kinetic Damping devrede. Fizik motoru ağırlaştırıldı.");

        // 2. Erken Olay Fırlatımı 
        window.dispatchEvent(new CustomEvent('SantisStressPredicted', { 
            detail: { trigger: reason, timestamp: Date.now() } 
        }));

        // 3. Ghost Loading (Pre-fetch Recovery Visuals)
        this.ghostLoadRecoveryVisuals();

        // 10 saniye sonra öngörü kilidini kaldır (Recovery'den sonra sistem normale dönsün diye)
        setTimeout(() => { this.isPredicted = false; style.remove(); }, 10000);
    }

    ghostLoadRecoveryVisuals() {
        console.log("👻 [Orchestrator] Ghost Loading: Recovery (Soft-Light) görselleri arka planda Cache'e çekiliyor...");
        // Normalde Manifest'ten çekilir, mock test için:
        const preloads = [
            '/assets/img/cards/Santis-spa-rest-graded-clean.webp',
            '/assets/img/cards/Santis-face-mask-4x5-1080x1350.webp'
        ];
        
        preloads.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisPredictive = new SantisPredictiveOrchestrator());
} else {
    window.SantisPredictive = new SantisPredictiveOrchestrator();
}
