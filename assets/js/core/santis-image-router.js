// /assets/js/core/santis-image-router.js

export class SantisImageRouter {
    constructor() {
        // Visual Genome (DNA) Havuzu
        // Sistem ileride bu havuzdan rastgele (A/B Testi) veya mevsime göre görsel çekebilir.
        this.visualPool = {
            'PRESTIGE_MACRO': [
                '/assets/img/textures/oil-drop-macro.jpg'
            ],
            'CLEAN_TEXTURE': [
                '/assets/img/textures/marble-water.jpg'
            ],
            'THERAPY_TEXTURE': [
                '/assets/img/textures/dark-stone-steam.jpg'
            ],
            'ATMOSPHERE_WIDE': [
                '/assets/img/hero/santis_hero_main_v2.webp' // Existing hero fallback
            ],
            'ORGANIC_BOTANICAL': [
                '/assets/img/textures/marble-water.jpg' // Placeholder map
            ],
            'DISCOVERY_ARCHITECTURE': [
                '/assets/img/textures/marble-water.jpg',
                '/assets/img/textures/oil-drop-macro.jpg'
            ]
        };
    }

    /**
     * Verilen genetik koda (slotID) uygun görselin mutlak yolunu (URL) çözer.
     */
    resolveVisual(slotID, seed = 0) {
        const pool = this.visualPool[slotID];
        if (!pool || pool.length === 0) {
            console.warn(`[VISUAL ENGINE WARN] Kayıp Slot DNA'sı: ${slotID}. Fallback tetiklendi.`);
            // Sistem boş kalmasın diye nötr bir lüks doku döndürülür
            return '/assets/img/textures/marble-water.jpg'; 
        }
        
        return pool[seed % pool.length]; 
    }

    /**
     * DOM üzerindeki data-visual-slot etiketlerini bulur ve canlandırır (Hydration).
     */
    hydrateDOM(scope = document) {
        // Otonom olarak sayfadaki slot bekleyen tüm etiketleri yakala
        const visualNodes = scope.querySelectorAll('[data-visual-slot]:not(.hydrated)');
        
        visualNodes.forEach(element => {
            const slotID = element.getAttribute('data-visual-slot');
            const resolvedPath = this.resolveVisual(slotID);
            
            // Görsel yüklenmeden önceki hayalet (skeleton) durumu
            element.style.opacity = '0';
            element.style.transition = 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)'; // Sovereign Eğrisi
            
            if (element.tagName.toLowerCase() === 'img') {
                element.src = resolvedPath;
                element.onload = () => {
                    element.style.opacity = '1';
                    element.removeAttribute('data-visual-slot');
                };
            } else {
                // Preload the image for background
                const tempImg = new Image();
                tempImg.src = resolvedPath;
                tempImg.onload = () => {
                    element.style.backgroundImage = `url('${resolvedPath}')`;
                    element.style.opacity = '1';
                    element.removeAttribute('data-visual-slot');
                };
            }
            element.classList.add('hydrated');
        });

        if (visualNodes.length > 0) {
            console.log(`👁️‍🗨️ [VISUAL ENGINE] ${visualNodes.length} görsel slotu başarıyla rehidre edildi.`);
        }
    }
}

// Global olarak sistemi ayağa kaldır
window.SantisVisualEngine = new SantisImageRouter();
