/**
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME (SDCR V52.0 OMEGA)
 * Subsystem: The Cortex Core (santis-cortex-core.js)
 * Purpose: Topological Sort DAG Router, Dependency Resolution, Cycle Isolation, and Axolotl Resurrection.
 */

class SantisCortexCore {
    constructor() {
        this.registry = new Map(); // Module definitions
        this.executionOrder = [];  // L (Sorted List)
        this.quarantined = new Set(); // Isolated cancerous nodes
        this.dag = new Map(); // Adjacency list: node -> [dependencies that rely on it]
        this.inDegree = new Map(); // node -> number of dependencies it needs
        this.states = new Map(); // Execution context states
        this.amputatedModules = new Set(); // Modules waiting for Resurrection
        this.isResurrecting = false;
        
        console.log(`[SDCR:CORTEX] Operating System Kernel Booted. Awaiting Genesis DNA.`);
    }

    /**
     * Register a module's DNA into the Cortex.
     * @param {string} id - Module ID
     * @param {Array<string>} deps - Array of Dependency IDs
     * @param {Function} factory - The execution function
     */
    registerDNA(id, deps = [], factory = null) {
        if (this.registry.has(id)) {
            console.warn(`[SDCR:CORTEX] DNA Overwrite Attempt Blocked: ${id}`);
            return;
        }

        this.registry.set(id, {
            id,
            deps,
            factory,
            status: 'REGISTERED' // REGISTERED, RESOLVED, EXECUTING, ACTIVE, QUARANTINED
        });

        this.inDegree.set(id, deps.length);
        if (!this.dag.has(id)) this.dag.set(id, []);

        deps.forEach(dep => {
            if (!this.dag.has(dep)) this.dag.set(dep, []);
            this.dag.get(dep).push(id);
            if (!this.inDegree.has(dep)) this.inDegree.set(dep, 0);
        });
    }

    /**
     * Resolve the DAG architecture using Kahn's Topological Sort Algorithm (V52.0 Modified)
     */
    resolveTopology() {
        console.log(`[SDCR:CORTEX] Initiating Topological Resolution...`);
        let L = []; 
        let S = []; 

        for (let [node, degree] of this.inDegree.entries()) {
            if (degree === 0 && this.registry.has(node) && !this.quarantined.has(node)) {
                S.push(node);
            }
        }

        let inDegreeClone = new Map(this.inDegree);

        while (S.length > 0) {
            let n = S.shift();
            L.push(n);

            let descendants = this.dag.get(n) || [];
            for (let m of descendants) {
                if (this.quarantined.has(m)) continue;

                let currentDegree = inDegreeClone.get(m) - 1;
                inDegreeClone.set(m, currentDegree);

                if (currentDegree === 0) {
                    S.push(m);
                }
            }
        }

        let hasCycles = false;
        for (let [node, degree] of inDegreeClone.entries()) {
            if (degree > 0 && !this.quarantined.has(node) && this.registry.has(node)) {
                console.error(`[SDCR:CORTEX] FATAL PARADOX DETECTED: Circular Dependency in '${node}'. Isolating Node.`);
                this.quarantineNode(node);
                hasCycles = true;
            }
        }

        if (hasCycles) {
            console.warn(`[SDCR:CORTEX] Re-calculating Safe Topology...`);
            return this.resolveTopology();
        }

        this.executionOrder = L;
        console.log(`[SDCR:CORTEX] Topology Resolved. Boot Sequence: `, this.executionOrder);
        return true;
    }

    quarantineNode(id) {
        this.quarantined.add(id);
        if (this.registry.has(id)) {
            this.registry.get(id).status = 'QUARANTINED';
        }
    }

    async boot() {
        if (!this.resolveTopology()) {
            console.error(`[SDCR:CORTEX] System halted. Unresolvable Paradoxes.`);
            return;
        }

        console.log(`[SDCR:CORTEX] Executing Ignition Sequence...`);
        
        for (let id of this.executionOrder) {
            const moduleDNA = this.registry.get(id);
            if (!moduleDNA || moduleDNA.status === 'QUARANTINED') continue;

            try {
                moduleDNA.status = 'EXECUTING';
                
                if (typeof moduleDNA.factory === 'function') {
                    const resolvedDeps = moduleDNA.deps.map(depId => this.states.get(depId));
                    const state = await moduleDNA.factory(...resolvedDeps);
                    
                    // 🔴 AXOLOTL PROTOCOL: RESURRECTION HOOK DETECTION
                    if (state && state.__sdcr_amputated) {
                        console.warn(`[SDCR:CORTEX] Modül [${id}] sentetik olarak ampute edilmiştir. Axolotl diriliş sırasına alındı.`);
                        this.amputatedModules.add({ id, url: state.__original_url, factory: moduleDNA.factory });
                        if (window.__SDCR_BLACKBOX__) window.__SDCR_BLACKBOX__.record('CORTEX', 'SKIP_MODULE', 'SSS_CRITICAL', { id });
                    }
                    
                    this.states.set(id, state);
                }
                
                moduleDNA.status = 'ACTIVE';
                console.log(`[SDCR:CORTEX] Task Resolved: Module [${id}] Active.`);
            } catch (err) {
                console.error(`[SDCR:CORTEX] Runtime Error in Module '${id}'. Triggering Amputation.`, err);
                this.quarantineNode(id);
            }
        }
        
        console.log(`[SDCR:CORTEX] Boot Sequence Complete. System Stabilized.`);

        // 🔵 SSS yeşil bölgeye düştüğünde Axolotl Canlanmasını Tetikle
        window.addEventListener('sdcr:telemetry_update', (e) => {
            const currentSSS = e.detail.sss;
            if (currentSSS < 200 && this.amputatedModules.size > 0 && !this.isResurrecting) {
                this.triggerResurrection();
            }
        });
    }

    /**
     * SSS < 200 (Yeşil Bölge) olduğunda arka planda sessizce indir ve Hot-Swap (Yer Değiştir)
     */
    triggerResurrection() {
        if (this.isResurrecting || this.amputatedModules.size === 0) return;
        this.isResurrecting = true;
        console.warn(`[SDCR:AXOLOTL] SSS <%200. Sistem Soğudu. Diriliş Protokolü (Axolotl) Başlatılıyor...`);

        this.amputatedModules.forEach(async (mod) => {
            if (!mod.url) return;
            try {
                console.log(`[SDCR:AXOLOTL] Arka planda ${mod.id} indiriliyor...`);
                // Service Worker'ın kalkanı düşürmesi için Resurrection parametresini ekle
                const resurrectedUrl = new URL(mod.url);
                resurrectedUrl.searchParams.set('sdcr_resurrect', 'true');
                
                // ES Modülü olarak canlı canlı sayfaya import et
                const realModule = await import(/* @vite-ignore */ resurrectedUrl.href);
                
                // Hot-Swap (Gerçek modülü ağaca monte et)
                this.states.set(mod.id, realModule.default || realModule);
                this.amputatedModules.delete(mod);
                
                console.log(`[SDCR:AXOLOTL] 🦎 Diriliş Başarılı: [${mod.id}] tam fonskiyonellikle yerine yerleştirildi (Hot-Swap).`);
                if (window.__SDCR_BLACKBOX__) window.__SDCR_BLACKBOX__.record('CORTEX', 'RESURRECT', 'SYSTEM_COOLED_DOWN', { id: mod.id });
            } catch (error) {
                console.error(`[SDCR:AXOLOTL] Diriliş Hatası: ${mod.id} kurtarılamadı.`, error);
            }
        });
        
        // Bir sonraki diriliş döngüsü için bekle
        setTimeout(() => { this.isResurrecting = false; }, 3000);
    }
}

// Global Export
window.SDCR = window.SDCR || {};
window.SDCR.Cortex = window.SDCR.Cortex || new SantisCortexCore();
