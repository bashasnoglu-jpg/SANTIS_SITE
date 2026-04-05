/**
 * 📳 [SANTIS HAPTIC RESONANCE] - Phase K
 * Sovereign Tactile Engine: "Dokuma" lüksünü fizikselleştiren mikro-titreşimler.
 */

const HapticResonance = (() => {
    // Mobil cihazlarda Titreşim Desteği Kontrolü
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    // Özel "Quiet Luxury" Titreşim Ritimleri
    const PATTERNS = {
        tick: [10],                        // İpeksi, çok hafif bir dokunuş (Normal linkler)
        ripple: [15, 30, 15],              // Suda dalgalanma hissi (Ghost Transition)
        bass: [25, 40, 20],                // Tok, ağır bir taş hissi (Ana Butonlar / CTAlar)
        error: [30, 50, 30, 50, 30],       // Çatlak / Hata hissi
        success: [15, 80, 20]              // Başarılı işlem hissi (Örn: Rezervasyon Mühürlendi)
    };

    const trigger = (type = 'tick') => {
        if (!isSupported) return;
        
        const pattern = PATTERNS[type] || PATTERNS.tick;
        
        try {
            navigator.vibrate(pattern);
            // console.log(`📳 [Haptic Resonance] Triggered: ${type}`);
        } catch(e) { /* Sessizce devam et (örneğin kullanıcı izni vermemişse) */ }
    };

    const globalClickListener = (e) => {
        // En yakın etkileşimli elemanı bul
        const target = e.target.closest('a, button, .santis-btn, .santis-magnetic, .santis-stack-card');
        
        if (!target) return;

        // Pattern Karar Mekanizması
        if (target.classList.contains('hero-cta') || target.classList.contains('santis-btn-primary')) {
            trigger('bass');
        } else if (target.classList.contains('santis-magnetic') || target.classList.contains('santis-stack-card')) {
            trigger('ripple');
        } else if (target.tagName === 'A' || target.tagName === 'BUTTON') {
            trigger('tick');
        }
    };

    return {
        init: () => {
            if (!isSupported) {
                console.log("📳 [Haptic Resonance] Mobil dışı ortam tespit edildi (Sensör Offline)");
                return;
            }

            console.log("📳 [Haptic Resonance] Duyusal Motor Devrede (10ms-30ms Otonom Titreşimler Hazır)");
            
            // Mouse/Touch ortamlarında click ve touchstart birleşebilir, sadece click dinliyoruz.
            // B2B ve mobil performansı için 'passive' değil ama capture modunda çalıştırabiliriz
            document.addEventListener('click', globalClickListener, { capture: true, passive: true });
        },
        trigger // Başka modüllerin manuel tetikleyebilmesi için dışarı açıyoruz
    };
})();

export default HapticResonance;
