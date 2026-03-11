/**
 * ========================================================================
 * 🦅 SANTIS OS v34 — PHASE II: VECTOR ALPHA (SOVEREIGN ACOUSTICS)
 * ========================================================================
 * Zero-latency hardware audio synthesis. No MP3/WAV files loaded.
 * Pure mathematical waveforms hacking the auditory cortex.
 *
 * Features:
 *   1. 54Hz Sub-Bass Intent Hum (Triggers at L3 Event Horizon - 250px)
 *   2. Aristocratic Marble/Gold Click (Triggers on L5 Checkout Seal)
 *
 * Dependencies: None. Pairs with L5 checkout-ritual.js + L7 wallet-bridge.js.
 * Zero regression. Zero external audio files. Pure oscillator synthesis.
 * ========================================================================
 */

const SantisSovereignAcoustics = (() => {
    'use strict';

    let ctx = null;
    let isUnlocked = false;
    let humOsc = null;
    let humGain = null;
    let isHumming = false;

    // ── BUTTON SELECTORS (L3/L5 ile tam uyumlu) ──
    const BTN_SELECTOR = '.buy-btn, #main-buy-btn, .add-to-cart, #apex-btn, .btn-rezervasyon, .sovereign-rituals-cta';

    // ── 1. KİLİT AÇMA (Tarayıcı Güvenlik Aşımı) ──
    const unlockAudioEngine = () => {
        if (isUnlocked) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        ctx = new AudioContext();

        // Sessiz frekans ateşle — motoru rölantiye al
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.001);

        isUnlocked = true;
        console.log('🎵 [Santis OS v34] L6 Akustik Motor Donanıma Bağlandı. Web Audio API hazır.');

        // Temizlik
        ['click', 'touchstart', 'keydown'].forEach(e =>
            document.removeEventListener(e, unlockAudioEngine, { capture: true })
        );
    };

    // ── 2. NİYET UĞULTUSU (The Intent Hum — 54Hz Sub-Bass) ──
    // 432Hz evrensel frekansın çok derin, hipnotik alt oktavı
    const modulateHum = (active) => {
        if (!isUnlocked || !ctx || ctx.state === 'suspended') return;
        const time = ctx.currentTime;

        if (active) {
            if (!humOsc) {
                humOsc = ctx.createOscillator();
                humGain = ctx.createGain();

                humOsc.type = 'sine';
                humOsc.frequency.setValueAtTime(54, time);

                humGain.gain.setValueAtTime(0, time);
                // V12 motor rölantisi gibi 1.5 saniyede yavaşça yükselir
                humGain.gain.linearRampToValueAtTime(0.12, time + 1.5);

                humOsc.connect(humGain);
                humGain.connect(ctx.destination);
                humOsc.start();
                isHumming = true;
            }
        } else {
            if (humOsc && humGain) {
                // Fısıldayarak 0.8 saniyede sönümle
                humGain.gain.linearRampToValueAtTime(0.001, time + 0.8);
                const oscRef = humOsc;
                humOsc = null;
                humGain = null;
                isHumming = false;
                setTimeout(() => {
                    try { oscRef.stop(); oscRef.disconnect(); } catch (e) { /* already stopped */ }
                }, 1000);
            }
        }
    };

    // ── 3. MÜHÜR SESİ (The Aristocratic Seal Snap) ──
    // İki katmanlı: Derin tokluk (Sine) + Aristokratik klik (Triangle)
    const playSealSnap = () => {
        if (!isUnlocked || !ctx || ctx.state === 'suspended') return;
        const time = ctx.currentTime;

        // Katman 1: Derin Tokluk (The Obsidian Body — ağır kapı kapanışı)
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(150, time);
        bodyOsc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

        bodyGain.gain.setValueAtTime(1, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(ctx.destination);
        bodyOsc.start(time);
        bodyOsc.stop(time + 0.2);

        // Katman 2: Mermer/Altın Tıklaması (The Gold Transient — aristokratik klik)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle'; // Keskin tını için üçgen dalga
        clickOsc.frequency.setValueAtTime(800, time);
        clickOsc.frequency.exponentialRampToValueAtTime(50, time + 0.05);

        clickGain.gain.setValueAtTime(0.5, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(time);
        clickOsc.stop(time + 0.1);
    };

    // ── 4. SENSÖR ENTEGRASYONU (Sıfır DOM Hasarı) ──
    const setupSensors = () => {
        // Tarayıcı kilidini açıcılar
        ['click', 'touchstart', 'keydown'].forEach(e =>
            document.addEventListener(e, unlockAudioEngine, { once: true, capture: true })
        );

        // L3 Olay Ufku Entegrasyonu (Uğultu Sensörü)
        let lastCheck = 0;
        document.addEventListener('mousemove', (e) => {
            if (!isUnlocked || window.innerWidth < 768) return;

            // L5 mühürlenmişse uğultuyu sustur
            if (document.body.classList.contains('checkout-sealed')) {
                if (isHumming) modulateHum(false);
                return;
            }

            const now = performance.now();
            if (now - lastCheck < 50) return; // 20fps throttle
            lastCheck = now;

            const btns = document.querySelectorAll(BTN_SELECTOR);
            let inHorizon = false;

            btns.forEach(btn => {
                if (btn.offsetParent === null) return;
                const r = btn.getBoundingClientRect();
                const d = Math.hypot(
                    e.clientX - (r.left + r.width / 2),
                    e.clientY - (r.top + r.height / 2)
                );
                if (d < 250) inHorizon = true;
            });

            if (inHorizon !== isHumming) {
                modulateHum(inHorizon);
            }
        }, { passive: true });

        // L5 Mühür Ritüeli Entegrasyonu (Tok Klik Sensörü)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest(BTN_SELECTOR);
            if (btn && !document.body.classList.contains('checkout-sealed')) {
                // L5 Haptic Shake ile senkronize
                setTimeout(() => {
                    playSealSnap();
                    if (isHumming) modulateHum(false);
                }, 10);
            }
        }, true);

        // L7 Wallet butonları için de seal snap
        document.addEventListener('click', (e) => {
            if (e.target.closest('.wallet-btn')) {
                playSealSnap();
            }
        });
    };

    // ── INIT ──
    const init = () => {
        setupSensors();
        console.log('🎵 [Santis OS v34] L6 Sovereign Acoustics Mühürlendi. Kulaklıklar takılsın.');
    };

    // ── PUBLIC API ──
    return { init, playSealSnap, startHum: () => modulateHum(true), stopHum: () => modulateHum(false) };
})();

// ── GLOBAL BRIDGE ──
window.SantisAcoustics = SantisSovereignAcoustics;

// ── BOOTSTRAP ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SantisSovereignAcoustics.init);
} else {
    SantisSovereignAcoustics.init();
}
