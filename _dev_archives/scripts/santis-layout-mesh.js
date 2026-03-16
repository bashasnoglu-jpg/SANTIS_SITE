/**
 * SANTIS OS - LAYOUT INTELLIGENCE ENGINE (THE MESH) / V6
 * Zero "Layout Thrashing", O(1) Buffer Updates
 * 
 * Bu sınıf ekranın (Intersection) ve boyutların (Resize) sınırlarını 
 * donanım seviyesinde izler. DOM'u saniyede 60 kez okuma zulmüne son verir.
 */

export class SantisLayoutMesh {
    constructor() {
        this.activeCardsCache = new Map();

        // Bu EventTarget, görünürlük değiştiğinde GPU-Field'ı uyaracak
        this.events = new EventTarget();

        this.initObservers();
    }

    initObservers() {
        this.visibilityMesh = new IntersectionObserver((entries) => {
            let changed = false;
            entries.forEach(entry => {
                const cardEl = entry.target;

                if (entry.isIntersecting) {
                    this.updateCardCache(cardEl);
                    this.resizeMesh.observe(cardEl);
                    changed = true;
                } else {
                    if (this.activeCardsCache.has(cardEl)) {
                        this.activeCardsCache.delete(cardEl);
                        this.resizeMesh.unobserve(cardEl);
                        changed = true;
                    }
                }
            });
            // Eğer bir kart girip/çıkarsa GPU'yu uyar
            if (changed) this.events.dispatchEvent(new Event('mesh_update'));

        }, {
            // Kart ekrana %1 bile girse, hatta 100px önceden tetikle
            rootMargin: '100px 0px 100px 0px',
            threshold: 0.01
        });

        this.resizeMesh = new ResizeObserver((entries) => {
            let changed = false;
            entries.forEach(entry => {
                const cardEl = entry.target;
                if (this.activeCardsCache.has(cardEl)) {
                    this.updateCardCache(cardEl);
                    changed = true;
                }
            });
            if (changed) this.events.dispatchEvent(new Event('mesh_update'));
        });
    }

    /**
     * DOM elemanını ağa bağlar. GPU'nun ihtiyacı olan DNA'yı (Renk, Efekt) saklar.
     * @param {HTMLElement} domElement 
     * @param {Object} ritualDNA { color: [r,g,b], effect: float }
     */
    observeCard(domElement, ritualDNA) {
        if (!ritualDNA) {
            // Sessiz Lüks varsayılan DNA (Ghost Forge)
            ritualDNA = { color: [0.3, 0.28, 0.25], effect: 1.0 };
        }
        domElement._santisDNA = ritualDNA;

        this.visibilityMesh.observe(domElement);
    }

    // EN PAHALI İŞLEM! (getBoundingClientRect)
    // Sadece observer tetiklendiğinde (Kart ekrana girdiğinde/boyutlandığında) 1 KERE ÇALIŞIR.
    updateCardCache(cardEl) {
        const rect = cardEl.getBoundingClientRect();

        // DİKKAT: Sayfa scroll ofsetini de hesaba katarak *Mutlak Doküman Koordinatlarını* buluyoruz.
        // GPU'ya atarken güncel scroll miktarından çıkaracağız (O(1) Scroll).
        const absoluteY = rect.top + window.scrollY;
        const absoluteX = rect.left + window.scrollX;

        this.activeCardsCache.set(cardEl, {
            x: absoluteX,
            y: absoluteY,
            w: rect.width,
            h: rect.height,
            dna: cardEl._santisDNA
        });
    }

    /**
     * GPU bu fonksiyonu her frame çağırabilir, çünkü bu BİR JAVASCRIPT MAP'tir.
     * DOM sorgusu (Layout Thrashing) YOKTUR!
     */
    getVisibleCache() {
        return this.activeCardsCache;
    }
}

window.SantisLayoutMesh = SantisLayoutMesh;
