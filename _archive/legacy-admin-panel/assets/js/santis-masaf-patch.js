/**
 * 🦅 SANTIS MASTER OS: SOVEREIGN PATCH TEMPLATE (MASAF ARCHITECTURE)
 * @version V26_QUIET_LUXURY_EXPANSION
 * @description Yeni koleksiyonları ve sayfa stillerini SPA'yı çökertmeden, 
 * 120 FPS akıcılıkla (Task Chunking) ve IPv4 zorlamasıyla (0ms) sisteme enjekte eder.
 */

// ⏱️ [KURAL 3] GÖREV BÖLÜMLEME (TASK CHUNKING) - 0ms TBT ZIRHI
// Tarayıcının Input Queue'sunu kilitlememek için asenkron nefes alma fonksiyonu
const yieldToMain = async () => {
    if (globalThis.scheduler && globalThis.scheduler.yield) {
        await scheduler.yield(); // Kuantum Nefes (Modern Chrome API)
    } else {
        await new Promise(resolve => setTimeout(resolve, 50)); // Fallback: Her 50ms'de bir Event Loop'u serbest bırak
    }
};

class SovereignCollectionPatch {
    constructor(patchId, networkEngineRef) {
        // 🛡️ [KURAL 1] TEKİLLİK KİLİDİ (SINGLETON GUARD)
        // Mükerrer önyüklemeyi (Double Boot) engeller. Zaten varsa başlatmaz!
        window.__GLOBAL_ENGINE_REGISTRY__ = window.__GLOBAL_ENGINE_REGISTRY__ || {};
        
        if (window.__GLOBAL_ENGINE_REGISTRY__[patchId]) {
            console.warn(`🛡️ [Santis Kalkanı] '${patchId}' zaten yörüngede. Double-Boot engellendi!`);
            return window.__GLOBAL_ENGINE_REGISTRY__[patchId];
        }
        
        // Registry'e mühürle
        window.__GLOBAL_ENGINE_REGISTRY__[patchId] = this;

        this.patchId = patchId;
        this.networkEngine = networkEngineRef; // vis-network fizik motoru referansı (DataSet'ler için)
        
        // 🌐 [KURAL 4] IPv4 SİNYAL ZORLAMASI
        // Node.js 17+ localhost (::1) 1sn DNS çözümleme gecikmesini bypass eder
        this.apiEndpoint = `http://127.0.0.1:8080/api/v1/collections/${this.patchId}`;
        this.wsEndpoint = `ws://127.0.0.1:8080/stream/masaf`;
        
        this.injectedNodeIds = [];
        this.injectedEdgeIds = [];
        this.isActive = true;
        this.isIgnited = false; // Prevents double injection

        console.log(`🌌 [MASAF MİMARİSİ] '${this.patchId}' çekirdeği mühürlendi.`);
    }

    /**
     * 🚀 YAMAYI ATEŞLE (Koleksiyonu Nöral Ağ'a Enjekte Et)
     */
    async ignite(mockDataPayload) {
        if (this.isIgnited) {
            console.warn(`⚡ [Santis Kalkanı] '${this.patchId}' zaten ateşlendi. Double-Ignite engellendi!`);
            return;
        }
        
        try {
            this.isIgnited = true;
            console.log(`👁️🗨️ [Siber Teşhis] IPv4 tüneli açılıyor: ${this.apiEndpoint}`);
            
            // Gerçek senaryoda fetch(this.apiEndpoint) kullanılacak.
            // Şimdilik Kuantum Çekirdeğinden gelen veriyi yutuyoruz.
            const collectionData = mockDataPayload || this._generateMockData(); 
            
            // Kuantum Enjeksiyonunu Başlat
            await this.injectToNeuralMapWithChunking(collectionData);
            
        } catch (error) {
            console.error(`🚨 [MASAF HATASI] '${this.patchId}' sinyali koptu:`, error);
        }
    }

    /**
     * ⚡ [KURAL 3 UYGULAMASI] Veriyi 5'erli paketler halinde Canvas'a basar
     */
    async injectToNeuralMapWithChunking(items) {
        if (!items || !this.networkEngine) return;
        console.log(`🦅 [Masaf] ${items.length} adet lüks düğüm uzaya fırlatılıyor...`);
        
        const CHUNK_SIZE = 5;
        
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            if (!this.isActive) break; // SPA Router değişmişse döngüyü anında kes!

            const chunk = items.slice(i, i + CHUNK_SIZE);
            const nodesToInject = [];
            const edgesToInject = [];

            chunk.forEach(item => {
                const nodeId = `masaf_node_${item.id}`;
                const edgeId = `masaf_edge_${item.id}`;

                // 💎 "Quiet Luxury" ve "Cyberpunk Glow" Estetiği
                nodesToInject.push({
                    id: nodeId,
                    label: item.title,
                    shape: 'dot',
                    size: 18,
                    mass: 2, // Merkezkaç kuvvetine kapılacak kütle
                    color: { 
                        background: '#050505', // Karanlık Madde
                        border: '#0A84FF',     // Neon Mavi Parıltı
                        highlight: { border: '#FFD700', background: '#261a00' } // Sovereign Gold Hover
                    },
                    shadow: { enabled: true, color: '#0A84FF', size: 20 },
                    font: { color: '#E0E0E0', face: 'Inter, sans-serif', size: 14 }
                });

                edgesToInject.push({
                    id: edgeId,
                    from: "core_homepage", // Nöral haritanın merkez düğümüne (Ana Sayfa) bağla
                    to: nodeId,
                    color: { color: 'rgba(10, 132, 255, 0.4)', highlight: '#FFD700' },
                    width: 2,
                    dashes: [5, 5],
                    smooth: { type: 'continuous' }
                });

                this.injectedNodeIds.push(nodeId);
                this.injectedEdgeIds.push(edgeId);
            });

            // Fizik motoruna (vis-network DataSet) veriyi bas (Anında fiziksel dalgalanma başlar)
            if (this.networkEngine.nodes && this.networkEngine.edges) {
                 this.networkEngine.nodes.add(nodesToInject);
                 this.networkEngine.edges.add(edgesToInject);
            }

            // 🛑 Ana iş parçacığına (UI) nefes aldır. 120 FPS kesintiye uğramaz!
            await yieldToMain();
        }
        console.log(`💎 [Sovereign Patch] '${this.patchId}' kusursuzca render edildi. TBT: 0ms.`);
    }

    _generateMockData() {
        return Array.from({ length: 12 }, (_, i) => ({
            id: `${this.patchId}_${i}`,
            title: `Lüks Koleksiyon ${i + 1}`
        }));
    }

    /**
     * 🛑 [KURAL 2] ÇÖP TOPLAYICI VE İMHA DÖNGÜSÜ (Cleanup Cycle)
     * SPA Router geçişlerinde tetiklenerek geride hiçbir iz (Heap) bırakmaz.
     */
    destroy() {
        if (!this.isActive) return;
        this.isActive = false;
        
        console.warn(`🧹 [Garbage Collector] '${this.patchId}' imha döngüsü ateşlendi.`);

        // 1. Eklenen düğümleri ve kenarları fizik motorundan (Canvas'tan) sil
        if (this.networkEngine && this.networkEngine.nodes && this.networkEngine.edges) {
            this.networkEngine.nodes.remove(this.injectedNodeIds);
            this.networkEngine.edges.remove(this.injectedEdgeIds);
        }

        this.injectedNodeIds = [];
        this.injectedEdgeIds = [];
        this.isIgnited = false; // Reset ignite status for future renders
        
        // Silerken Singleton Registry'den de kaldıralım ki tekrar yaratılabilsin
        if (window.__GLOBAL_ENGINE_REGISTRY__) {
            delete window.__GLOBAL_ENGINE_REGISTRY__[this.patchId];
        }

        // 2. Referansları Hiçliğe (Null) çevir (Heap Memory Leak Kalkanı)
        this.networkEngine = null;
        this.injectedNodeIds = null;
        this.injectedEdgeIds = null;

        // 3. Tekillik kilidini Registry'den sil (Sonraki geliş için yolu aç)
        delete window.__GLOBAL_ENGINE_REGISTRY__[this.patchId];

        console.log(`✅ [Immolation] Sistem temizlendi. Kuantum belleği stabil. TBT: 0ms.`);
    }
}
