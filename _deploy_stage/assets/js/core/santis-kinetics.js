/**
 * Protocol 29: KINETIC CARD PHYSICS V3 (Global Sovereign Architecture)
 * 
 * Applies smooth HW-accelerated 3D tilts based on mouse coordinates relative
 * to the card boundaries. Works globally for all luxury cards when Whale Mode is active.
 */

class SantisKinetics {
    constructor() {
        this.isActive = true;
        // Sadece desktop/fare olan cihazlarda kinetik fizikleri aktive et (Performans Koruması)
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            this.init();
        }
        this.targetSelectors = '.nv-card-tarot, .nv-trend-card, .nv-signature-card, .bento-card, .nv-testimonial-card';
    }

    init() {
        console.log("💎 [Kinetics] Global 3D Parallax Physics Engine Online (V3 - System-Wide)");

        // Tek bir dinleyici (Event Delegation)
        document.body.addEventListener('mousemove', (e) => {
            // Fiziği sadece VIP / Sovereign mode açıksa aktif et!
            if (!document.body.classList.contains('whale-mode') && !document.body.classList.contains('is-sovereign-guest')) return;

            const card = e.target.closest(this.targetSelectors);
            if (!card) return;

            card.classList.remove('is-leaving');
            const rect = card.getBoundingClientRect();

            // Farenin kart üzerindeki konumu
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Matematiksel sınırlar (Maksimum ±6 derece her kart için genel denge)
            const maxTilt = 6;
            const rotX = ((y / rect.height) - 0.5) * (maxTilt * 2);
            const rotY = ((x / rect.width) - 0.5) * -(maxTilt * 2);

            // Sadece CSS değişkenlerini güncelle (Sıfır DOM Sorgusu!)
            requestAnimationFrame(() => {
                card.style.setProperty('--rotX', `${rotX}deg`);
                card.style.setProperty('--rotY', `${rotY}deg`);
                // Sentient Glow: Işığın merkez koordinatları
                card.style.setProperty('--mouseX', `${x}px`);
                card.style.setProperty('--mouseY', `${y}px`);
            });
        }, { passive: true });

        // Fare karttan çıkınca zarafetle sıfırla
        document.body.addEventListener('mouseout', (e) => {
            const card = e.target.closest(this.targetSelectors);
            if (!card) return;

            // Karta çıkış animasyon sınıfını ekle ve değişkenleri sıfırla
            card.classList.add('is-leaving');
            requestAnimationFrame(() => {
                card.style.setProperty('--rotX', '0deg');
                card.style.setProperty('--rotY', '0deg');
            });
        }, { passive: true });
    }
}

// OS Katmanında başlat
document.addEventListener('DOMContentLoaded', () => {
    window.santisKinetics = new SantisKinetics();
});
