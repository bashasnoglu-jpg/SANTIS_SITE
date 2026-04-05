/**
 * 🧘‍♂️ [SANTIS AUDIO ZEN] - Phase M
 * Sovereign Spatial Audio Engine: "Quiet Luxury" sessel geribildirimleri (Web Audio API)
 * Dış bağımlılık yok. Saf matematik ve frekans.
 */

const AudioZen = (() => {
    let audioCtx = null;
    let isUnlocked = false;

    // Frekans ve Envelope Ritimleri
    const SOUNDS = {
        // İpeksi, çok hafif bir hava akımı (Hover veya ufak tıklar)
        click: () => playTone(800, 'sine', 0.05, 0.01),
        
        // Suda dalgalanma hissi (Ghost Transition)
        ripple: () => playTone(432, 'sine', 0.15, 0.3, -200),
        
        // Tok, ağır bir taş hissi (Ana Butonlar / CTAlar)
        bass: () => playTone(55, 'triangle', 0.1, 0.4, -30)
    };

    const initAudio = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        isUnlocked = true;
    };

    const playTone = (freq, type, vol, duration, slide = 0) => {
        if (!isUnlocked || !audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = type;
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        
        // Frekans Kayması (Slide)
        osc.frequency.setValueAtTime(freq, now);
        if (slide !== 0) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(freq + slide, 20), now + duration);
        }

        // ADSR Zarfı (Yumuşak giriş ve sönümlenme)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + (duration * 0.1));
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    };

    const trigger = (type = 'click') => {
        if (!isUnlocked) initAudio(); // İlk tıklamada motoru ateşle
        if (SOUNDS[type]) SOUNDS[type]();
    };

    const globalClickListener = (e) => {
        // İlk etkileşimde Audio Context blokesini kaldır
        if (!isUnlocked) initAudio();

        const target = e.target.closest('a, button, .santis-btn, .santis-magnetic, .santis-stack-card');
        if (!target) return;

        // Ses Karar Mekanizması
        if (target.classList.contains('hero-cta') || target.classList.contains('santis-btn-primary')) {
            trigger('bass');
        } else if (target.classList.contains('santis-magnetic') || target.classList.contains('santis-stack-card')) {
            trigger('ripple');
        } else if (target.tagName === 'A' || target.tagName === 'BUTTON') {
            trigger('click');
        }
    };

    return {
        init: () => {
            console.log("🧘‍♂️ [Audio Zen] Spatial Ses Motoru Beklemede (İlk temasta 432Hz rezonans uyanacak)");
            
            // Kullanıcı ilk tıklayana kadar AudioContext askıda kalır (Tarayıcı Güvenlik Kuralı)
            document.addEventListener('click', globalClickListener, { capture: true, passive: true });
        },
        trigger
    };
})();

export default AudioZen;
