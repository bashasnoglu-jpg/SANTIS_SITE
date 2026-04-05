/**
 * Santis Neural Sensors (V40 Edge AI - Duyu Katmanı)
 * Görevi: Main Thread'i boğmadan kullanıcı etkileşimlerini sayısal vektörlere çevirmek.
 */
class SantisNeuralSensors {
    constructor() {
        // 1. Temel Durum (State) Belleği
        this.cursor = { x: 0, y: 0, time: Date.now() };
        this.lastCursor = { x: 0, y: 0, time: Date.now() };
        
        // 2. Kinetik Veriler
        this.kinematics = {
            velocity: 0,       // px/ms
            acceleration: 0,   // px/ms^2
            directionX: 0,     // -1 (Sol), 1 (Sağ)
            directionY: 0      // -1 (Yukarı), 1 (Aşağı)
        };

        // 3. Mikro-Duraksama (Hesitation) ve Bağlam Belleği
        this.context = {
            sessionStart: Date.now(),
            activeTarget: null,
            hesitationStartTime: 0,
            currentHesitationDuration: 0
        };

        this.isTicking = false; // RAF Kilidi
        this.initSensors();
    }

    initSensors() {
        // Fare hareketlerini dinle (passive: true ile scroll/render engellenmez)
        window.addEventListener('mousemove', (e) => this.captureCursor(e), { passive: true });

        // Stratejik elementleri dinle (Örn: <div data-neural-target="hamam-card">)
        this.attachHesitationSensors();
    }

    captureCursor(e) {
        // Sadece ham veriyi kaydet, ağır matematik işlemleri yapma
        this.cursor.x = e.clientX;
        this.cursor.y = e.clientY;
        this.cursor.time = Date.now();

        // Eğer RAF döngüsü çalışmıyorsa tetikle (Throttling mekanizması)
        if (!this.isTicking) {
            requestAnimationFrame(() => this.processKinematics());
            this.isTicking = true;
        }
    }

    processKinematics() {
        const dx = this.cursor.x - this.lastCursor.x;
        const dy = this.cursor.y - this.lastCursor.y;
        const dt = Math.max(this.cursor.time - this.lastCursor.time, 1); // Sıfıra bölünmeyi önle

        const distance = Math.sqrt(dx * dx + dy * dy);
        const currentVelocity = distance / dt;

        // İvme (Hızlanma/Yavaşlama) Hesaplama
        this.kinematics.acceleration = currentVelocity - this.kinematics.velocity;
        this.kinematics.velocity = currentVelocity;

        // Yön Vektörleri
        this.kinematics.directionX = Math.sign(dx);
        this.kinematics.directionY = Math.sign(dy);

        // Duraksama (Hesitation) Süresini Güncelle
        if (this.context.activeTarget) {
            this.context.currentHesitationDuration = Date.now() - this.context.hesitationStartTime;
        }

        // Son konumu güncelle ve kilidi aç
        this.lastCursor = { ...this.cursor };
        this.isTicking = false;
    }

    attachHesitationSensors() {
        // Sayfadaki stratejik elementleri bul ve mikro-duraksamaları ölç
        // MutationObserver eklenebilir ama statik sayfalar için querySelectorAll yeterlidir
        const targets = document.querySelectorAll('[data-neural-target]');
        
        targets.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                this.context.activeTarget = e.target.getAttribute('data-neural-target');
                this.context.hesitationStartTime = Date.now();
            }, { passive: true });

            el.addEventListener('mouseleave', () => {
                this.context.activeTarget = null;
                this.context.currentHesitationDuration = 0;
            }, { passive: true });
        });
    }

    /**
     * AI Çekirdeğinin tüketeceği "Normalize Edilmiş" Vektör Dizilimini üretir.
     * Değerler 0 ile 1 arasında sıkıştırılır (Yapay sinir ağları büyük sayıları sevmez).
     */
    extractVectorState() {
        const currentHour = new Date().getHours();
        const timeOfDayNormalized = currentHour / 24; // 0 (Gece Yarısı) - 1 (Gece 23:59)
        
        const sessionDwellTime = (Date.now() - this.context.sessionStart) / 1000; // Saniye

        // Yapay Zeka için JSON Vektörü
        return {
            v_time: parseFloat(timeOfDayNormalized.toFixed(3)),
            v_velocity: parseFloat(Math.min(this.kinematics.velocity, 5).toFixed(3)), // Max hızı limitledik
            v_acceleration: parseFloat(Math.max(Math.min(this.kinematics.acceleration, 2), -2).toFixed(3)),
            v_hesitation_ms: this.context.currentHesitationDuration,
            v_active_target: this.context.activeTarget,
            v_session_dwell_sec: Math.floor(sessionDwellTime)
        };
    }
}

export const santisSensors = new SantisNeuralSensors();
