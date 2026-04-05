/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V49.0
 * Modül: CORTEX CORE (DAG Orchestrator & Dependency Injector)
 * "Organlar kördür, sadece Cortex bütünü görür ve sıraya sokar."
 * =======================================================
 */

export class CortexCoreEngine {
    constructor() {
        this.registry = new Map();   // Organların DNA'sı (Kim kime muhtaç?)
        this.cache = new Map();      // Uyanmış, canlı organ referansları (Singleton)
        this.resolvingPromises = new Map(); // Paralel çağrıları birleştirmek için (Diamond Dependency Kalkanı)
    }

    // 1. ORGANLARI VE BAĞIMLILIKLARINI KAYDET
    register(id, dependencies = [], factoryFn) {
        if (this.registry.has(id)) {
            console.warn(`⚠️ [CORTEX] ${id} zaten kayıtlı.`);
            return;
        }
        this.registry.set(id, { dependencies, factoryFn });
    }

    // 2. KUSURSUZ UYANIŞ MATEMATİĞİ (Topological Resolution)
    async resolve(id, path = []) {
        // Zaten uyandıysa hafızadan (Cache) direkt ver
        if (this.cache.has(id)) return this.cache.get(id);

        // 🚨 GERÇEK ÖLÜMCÜL HATA KALKANI (True Circular Dependency)
        // Eğer çağrı yığınımızda (path) bu id varsa, tam eylemsizlik döngüsündeyiz demektir!
        if (path.includes(id)) {
            throw new Error(`💥 [CORTEX FATAL] Paradoks (Circular Dependency) Tespit Edildi! Kilitlenen Düğüm: ${id}. Döngü Geometrisi: ${path.join(' -> ')} -> ${id}`);
        }

        // 💎 DİAMOND DEPENDENCY KORUMASI (Paralel Yükleme Optimizasyonu)
        // Sistem 'Promise.all' kullandığı için aynı anda 3 organ NeuralBus'u isteyebilir. 
        // Döngüsel değil, paralel bir istek! Çözümlenmekte olan süreci (Promise'i) geri döndür.
        if (this.resolvingPromises.has(id)) {
            return this.resolvingPromises.get(id);
        }

        const node = this.registry.get(id);
        if (!node) {
            throw new Error(`☠️ [CORTEX FATAL] Kayıp Organ: [${id}] Kovan Zihninde bulunamadı!`);
        }

        // Düğümün uyanış sürecini kapsülleyen Promise
        const resolution = (async () => {
            try {
                const currentPath = [...path, id];
                
                // Bağımlılıkları PARALEL olarak ama akıllıca çöz
                const resolvedDeps = await Promise.all(
                    node.dependencies.map(dep => this.resolve(dep, currentPath))
                );

                const t0 = performance.now();
                const instance = await node.factoryFn(...resolvedDeps);
                const cost = performance.now() - t0;
                
                // 🧬 SYSTEM LEARNS FROM ITSELF (Meta-Gözlem)
                if (this.meta) {
                    this.meta.recordExecution(id, cost);
                    if (cost > 10) { // Darboğaz eşiği
                        this.meta.proposeRewrite(id, (n) => ({
                            ...n,
                            weight: (n.weight || 1) * 1.1,
                            latencyScore: cost,
                            dependencies: this.meta.rebalance(n.dependencies)
                        }));
                    }
                }

                this.cache.set(id, instance || true);
                
                console.log(`%c✔ [CORTEX] UYANDI: ${id} (${cost.toFixed(2)}ms)`, "color: #10b981; font-weight: bold;");
                return instance;
            } catch (error) {
                console.error(`💥 [CORTEX CRASH] [${id}] uyanırken parçalandı!`, error);
                throw error;
            } finally {
                // İşlem bittiğinde (başarılı veya hatalı) kayıt defterini temizle ki RAM işgal etmesin
                this.resolvingPromises.delete(id);
            }
        })();

        // Paralel isteklere aynı çözümü sunmak için bu Resolution'u ağa kaydet
        this.resolvingPromises.set(id, resolution);

        return resolution;
    }

    // 3. THE BIG BANG (Büyük Patlamayı Başlat)
    async ignite(entryNodes) {
        console.log("%c🧠 [CORTEX CORE] SİSTEM UYANDIRILIYOR... DAG HESAPLANIYOR.", "color: #8b5cf6; font-weight: bold;");
        const t0 = performance.now();

        try {
            // Ana kök düğümleri uyandır
            await Promise.all(entryNodes.map(node => this.resolve(node)));
            
            const t1 = performance.now();
            console.log(`%c🌌 [CORTEX] SINGULARITY ACHIEVED. Tüm Sistem Otonom Hizalandı. (${(t1 - t0).toFixed(2)}ms)`, "color: #06b6d4; font-weight: bold; background: #111; padding: 4px;");
            
            document.documentElement.setAttribute('data-sdcr-state', 'CONSCIOUS');
        } catch (error) {
            console.error("☠️ [CORTEX FATAL] Kovan Zihni Parçalandı!", error);
            document.documentElement.setAttribute('data-runtime', 'vanilla'); // Fallback
        }
    }
}

export const Cortex = new CortexCoreEngine();
