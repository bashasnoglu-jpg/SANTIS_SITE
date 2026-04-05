/**
 * 🦅 SANTIS OS [V44_APEX] - PREDICTIVE ADAPTIVE TEMPO AI
 * "Gelecek Görüşü: Tıklamadan Önce Eylem."
 * Bu modül, kullanıcı etkileşimlerini (fare vektörü, ivme, odak süresi) 
 * analiz ederek bir sonraki olası hedefi tahmin eder ve Medyum üzerinden 
 * veriyi önceden hazırlar.
 */

class SantisPredictiveAI {
    constructor() {
        this.config = {
            vectorThreshold: 0.85, // Tahmin güven eşiği (%85)
            velocityLimit: 2.0,    // Hızlı hareketlerde agresif tahmin
            predictionWindow: 150, // Milisaniye cinsinden geleceği görme penceresi
            debugMode: false       // God Mode için vektör çizimi
        };

        this.state = {
            mouseHistory: [],      // Son 5 fare koordinatı
            currentIntent: null,   // Tahmin edilen hedef element
            probabilityMap: new Map()
        };
    }

    async init() {
        console.log("⚡ [V44 Prediction] Gelecek Görüşü Motoru Çalıştırıldı. (Kinematik İz Sürme)");
        
        // Etkileşim dinleyicilerini başlat (Passive ve Throttle ile)
        window.addEventListener('mousemove', (e) => this.trackTrajectory(e), { passive: true });
        window.addEventListener('scroll', () => this.handleScrollIntent(), { passive: true });
    }

    /**
     * Fare hareket vektörünü hesaplar ve hedefi öngörür.
     */
    trackTrajectory(e) {
        // Governor zırhı: Fare olaylarının sistemi boğmasını engelle (50ms cooldown)
        if (window.__SANTIS_GOVERNOR__ && !window.__SANTIS_GOVERNOR__.canExecute('predictive_mouse_track', { cooldown: 50 })) return;

        const { clientX, clientY } = e;
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

        this.state.mouseHistory.push({ x: clientX, y: clientY, t: now });
        if (this.state.mouseHistory.length > 5) this.state.mouseHistory.shift();

        if (this.state.mouseHistory.length < 2) return;

        const p1 = this.state.mouseHistory[0];
        const p2 = this.state.mouseHistory[this.state.mouseHistory.length - 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dt = (p2.t - p1.t) || 1; // Sıfıra bölünme koruması

        const vx = dx / dt;
        const vy = dy / dt;

        // Çok yavaş (rölanti) hareketleri görmezden gel, intent (niyet) aranmıyor demektir
        if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) return;

        this.projectIntent(p2.x, p2.y, vx, vy);
    }

    /**
     * Mevcut hızla farenin X ms sonra nerede olacağını tahmin eder.
     */
    projectIntent(x, y, vx, vy) {
        const futureX = x + (vx * this.config.predictionWindow);
        const futureY = y + (vy * this.config.predictionWindow);

        // Ekran sınırlarını aşan projeksiyonları iptal et
        if (futureX < 0 || futureX > window.innerWidth || futureY < 0 || futureY > window.innerHeight) return;

        // Gelecekteki konumda hangi element var? (Kuantum Radarı)
        const target = document.elementFromPoint(futureX, futureY);

        if (target && (target.tagName === 'A' || target.closest('a') !== null || target.classList.contains('santis-trigger'))) {
            const finalTarget = target.tagName === 'A' ? target : (target.closest('a') || target);
            if (this.state.currentIntent !== finalTarget) {
                this.state.currentIntent = finalTarget;
                this.dispatchIntent(finalTarget);
            }
        } else {
            this.state.currentIntent = null;
        }
    }

    /**
     * Tahmin edilen hedefi Medyum ve Morph Engine'e bildirir.
     */
    async dispatchIntent(target) {
        // Temporal Orchestrator üzerinden düşük öncelikli (0) olarak işlet, ana akışı tıkama
        if (window.Temporal) {
            window.Temporal.schedule(() => this.executeIntent(target), { priority: 0, delay: 0 });
        } else {
            this.executeIntent(target);
        }
    }

    async executeIntent(target) {
        const rawUrl = target.getAttribute('href');
        if (!rawUrl || rawUrl.startsWith('#') || rawUrl.startsWith('javascript:')) return;
        
        const url = target.href; // Orijinal tam yolu elde et (Browser tarafından çözümlenmiş)

        // Sadece kendi originimiz içindeki linkleri tahmine (Prefetch) sok:
        // Harici linklere (WhatsApp, tel:, mailto: veya dış siteler) yapılan prefetch CORS'a takılır.
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.origin !== window.location.origin) return;
        } catch (e) {
            return; // Hatalı URL parse edilemezse iptal et
        }

        // Medyum'a fısılda: "İvme bu linke çarpacak, şimdiden yükle."
        if (window.SANTIS.Medyum) {
            console.log(`🔮 [V44 Prediction] Gelecek Sezildi: İvme Vektörü kilitlendi -> ${url} (Pre-fetch aktif)`);
            window.SANTIS.Medyum.prefetch(url); // Mimarın 'preheat' fonksiyonu Medyum'da prefetch olarak geçiyor
        }

        // Arayüz Morph Engine (Aurelia Ghost vb) için "pikselleri ısıt" sinyali
        window.dispatchEvent(new CustomEvent('santis:intent_detected', {
            detail: { target: target, url: url }
        }));
    }

    handleScrollIntent() {
        if (window.__SANTIS_GOVERNOR__ && !window.__SANTIS_GOVERNOR__.canExecute('scroll_intent', { cooldown: 200 })) return;
        // İleride Medyum lazy-load önden yüklemesi için ivmeli scroll takip edilecek
    }
}

// Global Core Kaydı
import { register } from '../core/santis-kernel.js';
export let PredictiveAI;

register('predictive_ai', async () => {
    PredictiveAI = new SantisPredictiveAI();
    await PredictiveAI.init();
    
    // Global Export API
    window.SANTIS.PredictiveAI = PredictiveAI;
    window.SantisFuture = PredictiveAI; // Legacy
    
}, ['temporal', 'medyum', 'memory_purge']); // Zihin temizlendikten hemen sonra devreye girer
