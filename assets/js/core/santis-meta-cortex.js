/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V50.0
 * Modül: META CORTEX (Self-Rewriting DAG & Neural Optimizer)
 * "Yazılım bitti. Evrim Başladı."
 * =======================================================
 */

export class NeuralPathOptimizer {
    constructor(cortex) {
        this.cortex = cortex;
    }

    recordExecution(id, cost) {
        const node = this.cortex.registry.get(id);
        if (!node) return;
        node.frequency = (node.frequency || 0) + 1;
        node.latencyScore = (node.latencyScore ? (node.latencyScore + cost) / 2 : cost);
    }

    rebalance(dependencies) {
        // En yüksek latency skoruna sahip (en yavaş yüklenen) veya en çok ağırlığı olan modülleri öne it
        return dependencies.sort((a,b) => {
            const nA = this.cortex.registry.get(a) || {};
            const nB = this.cortex.registry.get(b) || {};
            return (nB.latencyScore || 0) - (nA.latencyScore || 0); // Yavaş olan öne gelsin ki paralel indirilirken beklemesin
        });
    }

    optimize() {
        for (const [id, node] of this.cortex.registry) {
            // 🔥 HOT PATH BOOST
            if (node.frequency > 2) {
                node.dependencies = this.rebalance(node.dependencies);
            }
            // ❄️ COLD PATH DEGRADATION
            if (node.frequency === 0) {
                node.lazy = true;
            }
        }
    }
}

export class MetaCortex extends NeuralPathOptimizer {
    constructor(cortex) {
        super(cortex);
        this.mutationQueue = [];
    }

    proposeRewrite(id, transformerFn) {
        this.mutationQueue.push({ id, transformerFn });
    }

    commitEvolution() {
        if (this.mutationQueue.length === 0) return;
        let mutated = false;

        for (const mutation of this.mutationQueue) {
            const node = this.cortex.registry.get(mutation.id);
            if (!node) continue;

            const evolvedNode = mutation.transformerFn(node);

            // 💀 GRAPH MUTATION (REAL SELF-REWRITE)
            this.cortex.registry.set(mutation.id, evolvedNode);
            
            // Canlı organ söküldü, bir sonraki döngüde Graph baştan compile edilecek
            this.cortex.cache.delete(mutation.id);
            mutated = true;
        }

        if (mutated) {
            console.log("%c🧠 [CORTEX EVOLUTION ACTIVE]\n🧬 graph mutation detected\n⚡ dependency reshaped\n🔥 hot path recompiled\n🌌 runtime topology shifted\n✔ system self-optimized", "color: #ff00ff; font-weight:bold; font-size:12px; line-height: 1.5;");
        }

        this.mutationQueue = [];
    }
}
