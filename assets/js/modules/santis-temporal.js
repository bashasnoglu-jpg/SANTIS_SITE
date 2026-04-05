/**
 * ═══════════════════════════════════════════════════════════════
 * ⏳ SANTIS TEMPORAL ORCHESTRATOR v43.0 (Adaptive Flow State)
 * ═══════════════════════════════════════════════════════════════
 * 
 * V42: Kuyruk tabanlı zaman senkronizasyonu
 * V43: Kullanıcı Ritmi (Tempo) Algılayıcısı ile Dinamik Gecikme (Dilation)
 */

class UserRhythm {
    constructor() {
        this.lastEvents = [];
        this.window = 2000; // Son 2 saniye
    }

    recordEvent() {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.lastEvents.push(now);
        this.lastEvents = this.lastEvents.filter(t => now - t <= this.window); // 2 saniyeden eskileri buda
    }

    getActivityLevel() {
        // 0 = Sakin (Boşta), 1 = Yüksek Tempo (Hızlı Scroll/Mouse)
        const count = this.lastEvents.length;
        const maxEvents = 25; 
        return Math.min(1, count / maxEvents);
    }
}

export const Rhythm = new UserRhythm();

// Kullanıcı girdilerini dinleme (Sistem yorulmasın diye passive:true ve throttle kalkanı ile)
if (typeof window !== 'undefined') {
    ['scroll', 'keydown', 'touchstart'].forEach(ev =>
        window.addEventListener(ev, () => Rhythm.recordEvent(), { passive: true })
    );

    let lastMouse = 0;
    window.addEventListener('mousemove', () => {
        const now = Date.now();
        if (now - lastMouse > 50) { // 50ms throttle (Mouse spamine karşı)
            Rhythm.recordEvent();
            lastMouse = now;
        }
    }, { passive: true });
}

class AdaptiveTemporalOrchestrator {
    constructor() {
        this.queue = [];
        this.isRunning = false;
        this.lastFrame = typeof performance !== 'undefined' ? performance.now() : Date.now();
        console.log('⏳ [Temporal V43] Adaptive Orchestrator Aktif. İnsan ritmi (Tempo) dinleniyor...');
    }

    schedule(task, options = {}) {
        const {
            priority = 1,
            delay = 0,
            type = 'normal'
        } = options;

        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        
        // V43: TEMPO DİLASYONU (Zaman Genleşmesi)
        const userActivity = Rhythm.getActivityLevel();
        
        // Formül: Kullanıcı yavaşsa delay 2 katına kadar uzar. Çok hızlıysa delay sabit kalır.
        const adaptiveDelay = delay * (1 + (1 - userActivity)); 

        this.queue.push({
            task,
            priority,
            time: now + adaptiveDelay,
            type,
            originalDelay: delay
        });

        this.run();
    }

    run() {
        if (this.isRunning) return;
        this.isRunning = true;

        const loop = () => {
            const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const delta = now - this.lastFrame;
            this.lastFrame = now;

            const userActivity = Rhythm.getActivityLevel();

            // V43 YÜK VE DURGUNLUK SAVUNMASI
            if (delta > 50 || userActivity < 0.2) {
                // Eğer CPU > 50ms kasıyorsa VEYA kullanıcı zaten çok durgunsa
                // Önceliği düşük (UI ve arka plan) işlerini ertele (Yorgunluğu at)
                this.queue = this.queue.map(t => {
                    if (t.priority <= 1) t.time += 16; // 1 frame ileri at
                    return t;
                });
            }

            // Zamanı gelmiş en acil (Priority) işleri öne al
            const ready = this.queue
                .filter(t => t.time <= now)
                .sort((a, b) => b.priority - a.priority);

            // Henüz zamanı gelmeyenler kuyrukta kalır
            this.queue = this.queue.filter(t => t.time > now);

            // Operasyonları ateşle
            ready.forEach(t => {
                try {
                    t.task();
                } catch (e) {
                    console.error('❌ [Temporal] Task Hatası:', e);
                }
            });

            // Kuyruk bitene kadar zincirle
            if (this.queue.length > 0) {
                requestAnimationFrame(loop);
            } else {
                this.isRunning = false;
            }
        };

        requestAnimationFrame(loop);
    }
}

// Global Bootloader Kaydı
import { register } from '../core/santis-kernel.js';
export let Temporal;
register('temporal', async () => {
    Temporal = new AdaptiveTemporalOrchestrator();
    window.SANTIS.Temporal = Temporal;
    window.Temporal = Temporal; // Kısayol Legacy uyumu
}, ['governor']);
