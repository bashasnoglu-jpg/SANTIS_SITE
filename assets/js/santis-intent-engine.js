/**
 * SANTIS OS - SOVEREIGN INTENT ENGINE V1
 * Kuantum Psikolojisi, Lerp Matematiği ve Asimetrik Sönümleme
 */

export class SovereignIntentEngine {
    constructor(gpuField) {
        this.gpuField = gpuField;

        // Kartların anlık niyet skorlarını (0.0 - 1.0) ve hedef skorlarını tutan RAM Önbelleği
        this.intentCache = new Map(); // key -> { current: 0.0, target: 0.0, element: node }

        // Asimetrik Hız Çarpanları (Lüksün Matematiği)
        this.ATTACK_SPEED = 0.05;  // Üzerine gelince (Lerp hızı) - Orta/Hızlı artış
        this.DECAY_SPEED = 0.015;  // Ayrılınca (Lerp hızı) - Çok yavaş (Hayalet) sönümleme

        this.initDelegation();
        console.log("🦅 [Sovereign Intent] Asimetrik Niyet Motoru Devrede.");
    }

    // Olay Delegasyonu ile tüm kartları tek noktadan dinle
    initDelegation() {
        const app = document.getElementById('santis-app');
        if (!app) return;

        // Fırtına Başlıyor (Hover / Pointer Enter)
        // Olay delegasyonunda mouseover/mouseout bubbling yapar.
        app.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.santis-card-armor');
            if (!card) return;

            const key = card.getAttribute('data-key');
            if (key) {
                if (!this.intentCache.has(key)) {
                    this.intentCache.set(key, { current: 0.0, target: 1.0, element: card });
                } else {
                    this.intentCache.get(key).target = 1.0;
                }
            }
        });

        // Fırtına Sönümleniyor (Hover Out / Pointer Leave)
        app.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.santis-card-armor');
            if (!card) return;

            // İç elemanlara geçerken mouseout tetiklenir, bunu relatedTarget ile filtreleyelim
            if (e.relatedTarget && card.contains(e.relatedTarget)) {
                return; // Hala kartın içindeyiz, çıkmadık
            }

            const key = card.getAttribute('data-key');
            if (key && this.intentCache.has(key)) {
                this.intentCache.get(key).target = 0.0;
            }
        });
    }

    // MotionKernel tarafından saniyede 60 kez (rAF) çağrılır!
    update() {
        let isAnimating = false;

        for (let [key, state] of this.intentCache.entries()) {
            // Eğer mevcut skor hedefe ulaştıysa hesaplama yapma
            if (Math.abs(state.target - state.current) < 0.001) {
                state.current = state.target;
                continue;
            }

            isAnimating = true;

            // Kuantum Asimetrisi: Artarken hızlı, azalırken yavaş (Hayalet Sönümleme)
            const speed = state.target === 1.0 ? this.ATTACK_SPEED : this.DECAY_SPEED;

            // Lerp (Linear Interpolation) ile Pürüzsüz İvmelenme
            state.current += (state.target - state.current) * speed;

            // --- GPU FIELD'A KUANTUM FISILTISI ---
            // gpuField.updateCardIntent metodu float32 array'deki ilgili offseti günceller
            if (this.gpuField && typeof this.gpuField.updateCardIntent === 'function') {
                this.gpuField.updateCardIntent(key, state.current);
            }
        }

        return isAnimating;
    }
}

window.SovereignIntentEngine = SovereignIntentEngine;
