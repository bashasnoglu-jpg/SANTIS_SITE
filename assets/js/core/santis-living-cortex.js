/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V50.0
 * Modül: THE LIVING CORTEX (Self-Rewriting DAG & Neural Evolution)
 * "Statik kod ölüdür. Sadece adapte olan organizmalar hayatta kalır."
 * =======================================================
 */

import { CortexCoreEngine } from './santis-cortex-core.js';

class NeuralPathOptimizer {
    constructor(cortex) {
        this.cortex = cortex;
        this.mutationLock = false; // "Graph Flapping" (Sonsuz Mutasyon) Kalkanı
    }

    // 1. GÖZLEM VE ÖĞRENME (Synaptic Profiling)
    recordSynapse(id, latencyMs) {
        const node = this.cortex.registry.get(id);
        if (!node) return;

        node.frequency = (node.frequency || 0) + 1;
        // Exponential Moving Average (EMA) ile gerçek zamanlı acı (gecikme) öğrenimi
        node.latencyScore = ((node.latencyScore || latencyMs) * 0.8) + (latencyMs * 0.2);
        node.lastUsed = performance.now();
    }

    // 2. OTONOM EVRİM (The Self-Rewriting Protocol)
    evolve() {
        if (this.mutationLock) return;
        this.mutationLock = true;

        let mutated = false;
        let pruned = false;
        const now = performance.now();

        for (const [id, node] of this.cortex.registry.entries()) {
            
            // 🔥 A) HOT PATH BOOST (Sinaptik Hızlandırma)
            // Eğer bir organ çok çağrıldıysa ve çoklu bağımlılığı varsa:
            if ((node.frequency || 0) > 10 && node.dependencies.length > 1) {
                const originalOrder = [...node.dependencies];
                
                // KENDİ KODUNU YENİDEN YAZ: En yavaş uyanan (ağır) bağımlılığı DİZİNİN EN BAŞINA AL!
                // Böylece Promise.all paralel çalışırken en ağır yük ilk sıraya girer ve I/O darboğazı aşılır.
                node.dependencies.sort((a, b) => {
                    const latA = this.cortex.registry.get(a)?.latencyScore || 0;
                    const latB = this.cortex.registry.get(b)?.latencyScore || 0;
                    return latB - latA; // Descending (Ağır olanlar öne)
                });

                if (originalOrder.join(',') !== node.dependencies.join(',')) {
                    console.log(`🧬 [EVOLUTION] Nöral yol yeniden yazıldı: [${id}] -> [${node.dependencies.join(', ')}]`);
                    mutated = true;
                }
                
                // Frekansı soğut (Zamanla unutma efekti - Plasticity Decay)
                node.frequency = Math.floor(node.frequency * 0.5);
            }

            // ❄️ B) COLD PATH DEGRADATION (Hücresel Ölüm / Apoptosis)
            // Lüks bir organ 60 saniyedir atılsa, RAM'den acımasızca tahliye et.
            if (node.lastUsed && (now - node.lastUsed > 60000) && !node.isSuspended) {
                // Hayati organları (Kuantum Kesesi vb.) koruma altına al
                if (!['NeuralDB', 'QuantumRouter'].includes(id)) {
                    console.warn(`💤 [APOPTOSIS] Doku reddi: [${id}] 60sn'dir atıl. V8 Cache'inden siliniyor.`);
                    this.cortex.cache.delete(id); // Garbage Collector'a yem et
                    node.isSuspended = true;
                    node.frequency = 0;
                    pruned = true;
                }
            }
        }

        if (mutated || pruned) {
            console.log("%c🌌 [LIVING CORTEX] Mutasyon Başarılı. Yeni DAG Topolojisi Devrede.", "color: #8b5cf6; font-weight: bold;");
        }
        
        this.mutationLock = false;
    }
}

export class LivingCortexEngine extends CortexCoreEngine {
    constructor() {
        super();
        this.optimizer = new NeuralPathOptimizer(this);
        
        // 🧠 OTONOM EVRİM DÖNGÜSÜ: Her 15 saniyede bir kendi zihnini optimize et!
        setInterval(() => this.optimizer.evolve(), 15000);
    }

    // 🌟 RUNTIME GRAPH MUTATION (Çalışırken Canlı Organ Nakli)
    update(id, newDependencies, newFactoryFn) {
        this.safeUpdate(() => {
            const node = this.registry.get(id);
            if (!node) throw new Error(`[CORTEX FATAL] Olmayan organ mutasyona uğrayamaz: ${id}`);

            // 🚨 RUNTIME DAG VALIDATION (Canlı Bağımlılık Kontrolü)
            for (const dep of newDependencies) {
                if (!this.registry.has(dep)) throw new Error(`[CORTEX FATAL] Kırık canlı bağ: ${id} -> ${dep}`);
            }

            node.dependencies = newDependencies;
            node.factoryFn = newFactoryFn;
            node.isSuspended = false;
            
            // Eski hafızayı sil, bir sonraki çağrıda YENİ organla doğsun!
            this.cache.delete(id); 
            console.log(`⚡ [CORTEX HOT-SWAP] [${id}] organı canlı canlı (Runtime) değiştirildi! Sayfa yenilenmeyecek.`);
        });
    }

    safeUpdate(fn) {
        if (this.optimizer.mutationLock) return;
        this.optimizer.mutationLock = true;
        try { fn(); } finally { this.optimizer.mutationLock = false; }
    }

    // Uyanış sürecini hackle (Gözlem ve Acı kaydı için)
    async resolve(id) {
        if (this.cache.has(id)) {
            this.optimizer.recordSynapse(id, 0.5); // Cache hit (çok az acı)
            return this.cache.get(id);
        }

        const node = this.registry.get(id);
        if (!node) throw new Error(`[CORTEX] Missing runtime node: ${id}`);

        if (this.resolving.has(id)) throw new Error(`[CORTEX FATAL] Paradoks Tespit Edildi: ${id}`);
        
        this.resolving.add(id);
        const t0 = performance.now();

        try {
            // Paralel uyanış tüneli
            const deps = await Promise.all(node.dependencies.map(d => this.resolve(d)));
            const instance = await node.factoryFn(...deps);
            
            const executionTime = performance.now() - t0;
            // Organın uyanış süresini kaydet (Gelecekteki evrimler için Latency Score)
            this.optimizer.recordSynapse(id, executionTime);

            this.cache.set(id, instance);
            node.isSuspended = false;
            this.resolving.delete(id);
            
            return instance;
        } catch (error) {
            this.resolving.delete(id);
            throw error;
        }
    }
}

// Yeni Evrimleşmiş Beyni Dışarı Aktar
export const Cortex = new LivingCortexEngine();
