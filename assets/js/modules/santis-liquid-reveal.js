/**
 * 💧 SANTIS LIQUID REVEAL ENGINE
 * Phase: VH-1 (Visual Hierarchy Evolution)
 * Felsefe: Massive Jitterless Momentum (Sıvı Ağırlık)
 */

export const initLiquidReveal = () => {
    // CSS Token'larını oku
    const rootStyle = getComputedStyle(document.documentElement);
    const durationSlow = parseFloat(rootStyle.getPropertyValue('--duration-slow')) || 1.2;
    const easeLux = rootStyle.getPropertyValue('--ease-lux') || "power4.out";

    // GSAP Timeline oluştur
    const tl = gsap.timeline({
        defaults: {
            ease: easeLux,
            duration: durationSlow
        }
    });

    // 1. Arka Plan Derinlik Kilidi (Parallax Start)
    tl.fromTo('.hero-visual', 
        { scale: 1.15, y: -20 }, 
        { scale: 1, y: 0, duration: durationSlow * 1.5 }, 
        0
    );

    // 2. Elementlerin "Sıvı Ağırlık" ile Yükselişi
    tl.fromTo('.hero-kicker', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: durationSlow * 0.8 }, 
        0.3
    );

    tl.fromTo('.hero-title', 
        { opacity: 0, y: 50, letterSpacing: '0.2em' }, 
        { opacity: 1, y: 0, letterSpacing: 'normal', duration: durationSlow }, 
        0.4
    );

    tl.fromTo('.hero-subtitle', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0 }, 
        0.6
    );

    tl.fromTo('.hero-cta', 
        { opacity: 0, y: 20, scale: 0.95 }, 
        { opacity: 1, y: 0, scale: 1 }, 
        0.8
    );

    console.log('🛡️ [Santis Reveal] Liquid Weight Engine Ignited.');
};

// Auto-init if not imported as module
if (window.gsap) {
    window.addEventListener('load', initLiquidReveal);
}
