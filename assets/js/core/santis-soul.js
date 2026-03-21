/**
 * 🦋 SANTIS SOUL ENGINE v1.0
 * Biometric Connection Layer: 4-7-8 Rhythm, Gyroscope Liquid Light, and SVG Phantom Glass
 */

class SantisSoulEngine {
    constructor() {
        this.active = false;
        this.lastTime = 0;
        this.timeAccumulator = 0;
        this.animationFrameId = null;
        this.lastBeat = false; // Haptic beat flag
        this.userInteracted = false; // Haptic/Audio unlock flag

        // Soul Flash State
        this.flashActive = false;
        this.flashEndTime = 0;

        // Base Configuration (4-7-8 Zen Rhythm -> 19s cycle)
        this.rhythm = {
            inhale: 4000,
            hold: 7000,
            exhale: 8000
        };
        this.cycleDuration = this.rhythm.inhale + this.rhythm.hold + this.rhythm.exhale;

        this.init();
    }

    init() {
        if (this.active) return;
        this.active = true;

        console.log("🦋 [Santis Soul Engine] Awakening biometric layer...");

        this.injectPhantomGlass();
        this.bindGyroscope();
        
        // 🛡️ Tarayıcı Güvenliği (Intervention Koruması): Haptic motorunu ilk tıklamayla serbest bırak
        const unlockHaptics = () => {
            this.userInteracted = true;
            document.removeEventListener('click', unlockHaptics);
            document.removeEventListener('touchstart', unlockHaptics);
        };
        document.addEventListener('click', unlockHaptics);
        document.addEventListener('touchstart', unlockHaptics, { passive: true });

        this.lastTime = performance.now();
        this.breatheLoop(this.lastTime);
    }

    injectPhantomGlass() {
        if (document.getElementById('santis-phantom-svg')) return;

        const svgNamespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNamespace, 'svg');
        svg.id = "santis-phantom-svg";
        svg.style.cssText = "position: absolute; width: 0; height: 0; pointer-events: none;";

        svg.innerHTML = `
            <filter id="phantom-glass" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
                <feColorMatrix type="matrix" values="1 0 0 0 0   0 1 0 0 0   0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise" />
                <feDisplacementMap in="SourceGraphic" in2="coloredNoise" scale="8" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        `;
        document.body.appendChild(svg);
    }

    bindGyroscope() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                // beta is front-to-back tilt in degrees, where front is positive
                // gamma is left-to-right tilt in degrees, where right is positive
                let x = e.gamma; // In degree in the range [-90,90]
                let y = e.beta;  // In degree in the range [-180,180]

                // Guard against nulls
                if (x === null || y === null) return;

                // Clamp values for smoother gradients
                x = Math.max(-90, Math.min(90, x));
                y = Math.max(-90, Math.min(90, y));

                // Map to normalized -1 to 1 range
                const normX = x / 90;
                const normY = y / 90;

                document.documentElement.style.setProperty('--gyro-x', normX);
                document.documentElement.style.setProperty('--gyro-y', normY);
            }, true);
        }
    }

    triggerSoulFlash(durationMs = 4000) {
        if (!this.active) return;
        console.log("⚡ [Santis Soul] SOUL FLASH (Kuantum Sıvı Metal) tetiklendi! Sistem Zen ritmine zorlanıyor.");
        this.flashActive = true;
        this.flashEndTime = performance.now() + durationMs;
        
        // 🌌 PHASE 34 DONANIMSAL SİMBİYOZ (Haptic Shockwave API Intervention Guard)
        if (navigator.vibrate && this.userInteracted) {
            navigator.vibrate([100, 50, 150, 50, 300]); // Heart palpitations dropping to zero
        }
        
        // 🎵 PHASE 34 KUANTUM AKUSTİK (Audio Shockwave)
        if(window.SantisAcoustics && typeof window.SantisAcoustics.triggerFlashAcoustics === 'function') {
            window.SantisAcoustics.triggerFlashAcoustics();
        }

        // Reset the breathing cycle to the start of Exhale (Zen calming) after flash
        this.timeAccumulator = this.rhythm.inhale + this.rhythm.hold;
        if(window.SantisFrictionEngine && window.SantisFrictionEngine.resetScore) {
            window.SantisFrictionEngine.resetScore();
        }
    }

    breatheLoop(timestamp) {
        if (!this.active) return;
        if (!this.lastTime) this.lastTime = timestamp;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        let intensity = 0;

        if (this.flashActive) {
            // Kuantum Sıvı Metal Flash Durumu (Override)
            const flashRemaining = this.flashEndTime - timestamp;
            if (flashRemaining <= 0) {
                this.flashActive = false; // Flash bitti
            } else {
                // Flash bitene kadar keskin bir ışık dalgalanması (Sine wave)
                intensity = 1.0 + Math.abs(Math.sin(timestamp / 100)) * 0.5;
                document.documentElement.style.setProperty('--santis-soul-flash', (flashRemaining / 4000).toFixed(3));
            }
        } 
        
        if (!this.flashActive) {
            document.documentElement.style.setProperty('--santis-soul-flash', "0");
            
            // Phase 33: Adaptive Heartbeat (Hiperventilasyon Algoritması)
            let frictionScore = 0;
            if (window.SantisFrictionEngine && typeof window.SantisFrictionEngine.getScore === 'function') {
                frictionScore = window.SantisFrictionEngine.getScore();
            }

            // Normalde çarpan 1.0'dır. Friction 70 olduğunda çarpan 3.0 olur (3 kat hızlı nefes / hiperventile).
            const speedMultiplier = 1.0 + (frictionScore / 35);
            this.timeAccumulator += deltaTime * speedMultiplier;

            const elapsed = this.timeAccumulator % this.cycleDuration;

            if (elapsed < this.rhythm.inhale) {
                // Inhale phase: easing smoothly from 0 to 1
                const progress = elapsed / this.rhythm.inhale;
                intensity = this.easeOutSine(progress);
                this.lastBeat = false; // Reset haptic flag
            } else if (elapsed < (this.rhythm.inhale + this.rhythm.hold)) {
                // Hold phase: steady at 1
                intensity = 1.0;
                
                // 🌌 PHASE 34 DONANIMSAL SİMBİYOZ (Haptic Soft Heartbeat at the peak of Inhale)
                if(!this.lastBeat) {
                    this.lastBeat = true;
                    if(navigator.vibrate && this.userInteracted) {
                        // Hafif bir kalp atışı: Güçlü vuruş, kısa boşluk, zayıf vuruş
                        // Eğer friction yüksekse, sert vur (hyperventilation haptic)
                        if(frictionScore > 40) navigator.vibrate([40, 30, 80]);
                        else navigator.vibrate([10, 50, 20]); // Minimal Zen Heartbeat
                    }
                }
            } else {
                // Exhale phase: fading out from 1 to 0
                const exhaleElapsed = elapsed - (this.rhythm.inhale + this.rhythm.hold);
                const progress = exhaleElapsed / this.rhythm.exhale;
                intensity = 1.0 - this.easeInOutQuad(progress);
            }
        }

        // Apply globally to CSS
        // Developers can use this variable to drive box-shadow opacities, glow intensities, etc.
        document.documentElement.style.setProperty('--soul-breath-intensity', intensity.toFixed(4));

        this.animationFrameId = requestAnimationFrame(this.breatheLoop.bind(this));
    }

    destroy() {
        this.active = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }

    // Easing functions for organic organic motion
    easeOutSine(x) {
        return Math.sin((x * Math.PI) / 2);
    }

    easeInOutQuad(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }
}

// Auto-boot Soul Engine
window.SantisSoul = new SantisSoulEngine();

/**
 * 🌌 SANTIS ACOUSTIC MATRIX v1.0 (Phase 34)
 * Spatial Zen Audio & Binaural Beats
 */
class SantisAcousticMatrix {
    constructor() {
        this.audioCtx = null;
        this.panner = null;
        this.oscLeft = null;
        this.oscRight = null;
        this.masterGain = null;
        this.active = false;
        
        // Tarayıcı güvenlik kısıtlamalarını (Autoplay Policy) aşmak için
        // İlk etkileşimde (tıklama) motoru serbest bırak
        const unlock = () => {
            document.removeEventListener('click', unlock);
            this.init();
        };
        document.addEventListener('click', unlock);
    }

    init() {
        if (this.active) return;
        this.active = true;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Kuantum Akustik: 3D Uzamsal Sesleyici (PannerNode)
        this.panner = this.audioCtx.createPanner();
        this.panner.panningModel = 'HRTF'; // İnsan kulak anatomisini taklit eder
        this.panner.distanceModel = 'inverse';
        this.panner.setPosition(0, 0, 1); 
        
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.05; // Fısıltı frekansında arka plan (Zen) sesi
        
        this.panner.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);
        
        // Sol Kulak: 432Hz (Evrensel Frekans) | Sağ Kulak: 436Hz (4Hz Theta Dalgaları = Derin Meditasyon)
        this.oscLeft = this.audioCtx.createOscillator();
        this.oscRight = this.audioCtx.createOscillator();
        this.oscLeft.type = 'sine';
        this.oscRight.type = 'sine';
        this.oscLeft.frequency.value = 432; 
        this.oscRight.frequency.value = 436;
        
        this.oscLeft.connect(this.panner);
        this.oscRight.connect(this.panner);
        
        this.oscLeft.start();
        this.oscRight.start();
        
        console.log("🎵 [Kuantum Akustik] Spatial Zen Audio ve Binaural Beats (4Hz Theta) aktif.");
        
        this.bindAcousticPan();
    }
    
    bindAcousticPan() {
        // Fareyi izleyen akustik
        document.addEventListener('mousemove', (e) => {
            if (!this.panner) return;
            // X eksenini -3 ile 3 uzamsal koordinat arasına haritala
            const panX = ((e.clientX / window.innerWidth) * 2 - 1) * 3;
            const panY = ((e.clientY / window.innerHeight) * 2 - 1) * -3; // Y ters
            
            this.panner.positionX.setTargetAtTime(panX, this.audioCtx.currentTime, 0.1);
            this.panner.positionY.setTargetAtTime(panY, this.audioCtx.currentTime, 0.1);
        });
        
        // Telefon (Jiroskop) hareketini izleyen akustik
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if(!this.panner || e.gamma === null) return;
                const gamma = Math.max(-90, Math.min(90, e.gamma)) / 30; // -3 to 3
                const beta  = Math.max(-90, Math.min(90, e.beta)) / 30;
                
                this.panner.positionX.setTargetAtTime(gamma, this.audioCtx.currentTime, 0.1);
                this.panner.positionY.setTargetAtTime(beta, this.audioCtx.currentTime, 0.1);
            });
        }
    }
    
    triggerFlashAcoustics() {
        if (!this.audioCtx) return;
        // Soul Flash sırasında frekansı geçici olarak 528Hz (Şifa / DNS Onarım) frekansına çıkart, 
        // ardından yavaşça tekrar 432Hz Zen'e düşür. Akustik Şok!
        this.oscLeft.frequency.setValueAtTime(528, this.audioCtx.currentTime); 
        this.oscRight.frequency.setValueAtTime(532, this.audioCtx.currentTime);
        
        this.oscLeft.frequency.exponentialRampToValueAtTime(432, this.audioCtx.currentTime + 4);
        this.oscRight.frequency.exponentialRampToValueAtTime(436, this.audioCtx.currentTime + 4);
    }
}
window.SantisAcoustics = new SantisAcousticMatrix();
