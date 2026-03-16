/**
 * Phase 80: The Experience Graph
 * Santis OS Core: Graph Resolver Engine (The Compass)
 */

const SantisGraphResolver = {
    graphData: null,
    isLoaded: false,

    async init() {
        try {
            const res = await fetch('/assets/data/experience_graph.json');
            this.graphData = await res.json();
            this.isLoaded = true;
            console.log("🧭 [GRAPH RESOLVER] Matrix loaded successfully.");

            // Pusulayı Event Bus'a bağla
            if (window.SantisEventBus) {
                window.SantisEventBus.subscribe('telemetry:intent_detected', (data) => this.resolvePath(data.intent));
                window.SantisEventBus.subscribe('telemetry:hesitation', (data) => this.adjustWeight(data.target, 0.1));
            } else {
                console.warn("🧭 [GRAPH RESOLVER] SantisEventBus not found. Running in isolation.");
            }

        } catch (e) {
            console.error("🧭 [GRAPH RESOLVER] Failed to load matrix. Defaulting to Fail-Safe route.", e);
        }
    },

    /**
     * Niyet (Intent) algılandığında en değerli rotayı hesaplar
     * @param {string} intentKey - Örn: 'luxury_stay', 'mental'
     */
    async resolvePath(intentKey) {
        if (!this.isLoaded || !this.graphData) {
            this.triggerFailSafe();
            return;
        }

        console.log(`🧭 [GRAPH RESOLVER] Pathfinding initiated at Edge for intent: ${intentKey} ...`);

        try {
            // Phase 82.2: Edge Worker Asenkron Rota Çözümlemesi
            // Cloudflare Workers Worker.js tarafından karşılanacaktır.
            const tenant_domain = window.location.hostname;
            const res = await fetch('/api/edge/resolve-path', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Domain': tenant_domain
                },
                body: JSON.stringify({
                    current_node: 'root', // Başlangıç düğümü
                    intent_score: 85, // Panopticon'dan gelebilir ama şimdilik mock
                    behavioral_tags: [intentKey]
                })
            });

            if (!res.ok) throw new Error("Edge unreachable");

            const data = await res.json();
            const bestTarget = data.route?.target_node;

            if (bestTarget) {
                console.log(`⚡ [EDGE NODE] Optimum route locked: [${bestTarget}] in ${data.latency_ms || 12}ms!`);

                // Hedef Node detaylarını bul
                const targetNode = this.graphData.nodes[bestTarget];

                if (window.SantisEventBus) {
                    window.SantisEventBus.publish('experience:resolved', { target_node: bestTarget, node_details: targetNode });
                }
            } else {
                this.triggerFailSafe();
            }

        } catch (e) {
            console.error("⚡ [EDGE NODE] Connection Failed! Reverting to Local Matrix...", e);
            this.triggerFailSafe();
        }
    },

    /**
     * Telemetry'den gelen tereddüt (hesitation) verisiyle Edge ağırlığını canlı günceller
     */
    adjustWeight(targetId, increment) {
        if (!this.isLoaded) return;

        const edge = this.graphData.edges.find(e => e.target === targetId);
        if (edge) {
            edge.weight += increment;
            console.log(`🧭 [GRAPH RESOLVER] Machine Learning Pulse: Edge [${edge.source}->${edge.target}] weight increased to ${edge.weight.toFixed(2)}`);
        }
    },

    /**
     * İletişim veya data kopukluğunda sistemi asla durdurmaz
     */
    triggerFailSafe() {
        console.warn("🧭 [GRAPH RESOLVER] Triggering Imperial Fail-Safe -> ottoman_apex.");
        if (window.SantisEventBus) {
            window.SantisEventBus.publish('experience:resolved', { target_node: 'ottoman_apex', is_failsafe: true });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => SantisGraphResolver.init());
