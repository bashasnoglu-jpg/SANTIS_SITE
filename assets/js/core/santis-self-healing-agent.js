/**
 * SANTIS OS - PHASE 55: SELF-HEALING SWARM
 * Görev: DOM üzerindeki kritik öğeleri ölümsüzleştirmek (Auto-Regeneration).
 */
class SantisSelfHealingSwarm {
    constructor(criticalSelectors) {
        this.targets = criticalSelectors;
        this.genesisCache = new Map(); // Orijinal DOM düğümlerinin kopyalarını tutar
        
        this.cacheGenesisStates();
        this.deployObserver();
        console.log("🧬 [Self-Healing Swarm] Ajanlar DOM Ağacına Yerleştirildi.");
    }

    cacheGenesisStates() {
        this.targets.forEach(selector => {
            const node = document.querySelector(selector);
            if (node) {
                // Öğenin dış dünyadan izole, derin bir kopyasını al (Genesis State)
                this.genesisCache.set(selector, {
                    element: node.cloneNode(true),
                    parent: node.parentNode,
                    nextSibling: node.nextSibling
                });
            }
        });
    }

    deployObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.removedNodes.forEach(removedNode => {
                    if (removedNode.nodeType !== 1) return; // Sadece HTML elementlerini kontrol et

                    // Kritik hedeflerden biri mi silindi?
                    for (let [selector, genesisData] of this.genesisCache.entries()) {
                        if (removedNode.matches(selector) || removedNode.querySelector(selector)) {
                            console.warn(`🚨 [Self-Healing Swarm] Kritik düğüm silindi: ${selector}`);
                            this.resurrectNode(selector, genesisData);
                        }
                    }
                });
            });
        });

        // Tüm gövdeyi ve alt düğümlerini izlemeye al
        observer.observe(document.body, { childList: true, subtree: true });
    }

    resurrectNode(selector, genesisData) {
        // Zombi döngüsünü engellemek için önce var mı kontrol et
        if (!document.querySelector(selector)) {
            // Öğeyi, silinmeden önceki orijinal konumuna geri yerleştir
            const clone = genesisData.element.cloneNode(true);
            
            if (genesisData.parent) {
                genesisData.parent.insertBefore(clone, genesisData.nextSibling);
                console.log(`✨ [Self-Healing Swarm] Node Mutation Detected. '${selector}' Restored to genesis state.`);
            } else {
                document.body.appendChild(clone);
                console.log(`✨ [Self-Healing Swarm] Node '${selector}' Appended to body as fallback.`);
            }
        }
    }
}

// Korumaya alınacak kritik cepheler (CSS Seçicileri)
const criticalNodes = [
    '#santis-header', 
    '#santis-main-nav', 
    '#santis-bento-universe', 
    '.santis-hero'
];

// --- SOVEREIGN IFF CALIBRATION (P4.3) ---
// Swarm'ı 'DOMContentLoaded' yerine Sovereign Router'ın DOM enjeksiyonunu
// tamamladığını bildiren 'santis:nav:ready' sinyali ile başlatıyoruz.
// Böylece dinamik oluşan menü genesis statüsünde kalacak (Friendly Fire Önlemi).

document.addEventListener('santis:nav:ready', () => {
    console.log("🛡️ [Sovereign IFF] Dynamic Nav Rendered. Initializing Self-Healing Swarm...");
    window.santisSwarmInstance = new SantisSelfHealingSwarm(criticalNodes);
});
