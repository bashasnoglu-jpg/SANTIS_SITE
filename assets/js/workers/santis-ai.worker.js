/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║  🧠 SANTIS AI WORKER v2.0 — Neural Intent Engine     ║
 * ║  Main Thread'den izole, sıfır DOM erişimi             ║
 * ╚═══════════════════════════════════════════════════════╝
 *
 * Comlink RPC: Main Thread'den await worker.fn() ile çağrılır
 * Kural: Bu dosya DOM'a asla dokunmaz. Sadece veri işler.
 */
import * as Comlink from 'https://unpkg.com/comlink/dist/esm/comlink.mjs';

const NeuralEngine = {

    /** Bağlantı testi */
    ping() {
        return `Worker Fabric Online! 🧠⚡ Thread: ${self.name || 'ai-worker'}`;
    },

    // ── INTENT ENGINE v1.0 ──────────────────────────────────────────────────
    /**
     * Sinyalleri analiz eder, niyeti okur, prefetch emirlerini döndürür.
     * Main Thread KARAR VERMEZ — sadece sinyalleri raporlar, emirleri uygular.
     *
     * @param {number} scrollDepth   0..1
     * @param {number} cursorSpeed   px/s
     * @param {number} hoverTime     saniye
     * @param {number} currentScore  mevcut VIP puan
     * @param {string} deviceTier    'high' | 'low'
     * @returns {{ score, tier, intent, actions: { prefetch: string[] } }}
     */
    analyzeIntent(scrollDepth, cursorSpeed, hoverTime, currentScore, deviceTier) {
        // 1. VIP Skor (Sigmoid normalize, 0..100)
        const raw =
            (scrollDepth * 40) +
            Math.min(cursorSpeed > 0 ? 1000 / cursorSpeed : 0, 20) +
            Math.min(hoverTime * 10, 20) +
            Math.min(currentScore, 20);
        const score = Math.round(100 / (1 + Math.exp(-0.08 * (raw - 50))));

        // 2. Niyet Okuma + Aksiyon Motoru (BEYIN KARAR VERİYOR)
        const prefetch = new Set();
        let intent = 'BROWSING';

        if (deviceTier !== 'low') {
            if (scrollDepth > 0.6) {
                prefetch.add('commerce');
                intent = 'EXPLORING_SERVICES';
            }
            if (score > 80) {
                prefetch.add('experience');
            }
            if (cursorSpeed < 300 && hoverTime > 1.5) {
                prefetch.add('commerce');
                intent = 'INTENT_TO_BOOK';
            }
            if (score >= 90) {
                prefetch.add('experience');
                prefetch.add('analytics');
                intent = 'VIP_CONVERSION';
            }
        }

        return {
            score,
            tier: score >= 90 ? 'VIP_ELITE'
                : score >= 70 ? 'VIP'
                : score >= 50 ? 'ENGAGED'
                :               'STANDARD',
            intent,
            actions: { prefetch: Array.from(prefetch) }
        };
    },

    // ── LEGACY: calculateVIPScore (analyzeIntent kullan) ────────────────────
    calculateVIPScore(scrollDepth, cursorSpeed, hoverTime, sessionScore = 0) {
        const raw =
            Math.min(scrollDepth * 100, 40) +
            Math.min(cursorSpeed / 50, 20) +
            Math.min(hoverTime * 10, 20) +
            Math.min(sessionScore, 20);
        const score = Math.round(100 / (1 + Math.exp(-0.08 * (raw - 50))));
        return {
            score,
            tier: score >= 90 ? 'PLATINUM'
                : score >= 75 ? 'VIP'
                : score >= 50 ? 'ENGAGED'
                :               'STANDARD'
        };
    },

    // ── Hizmet katalogu filtrele + sırala ───────────────────────────────────
    filterCatalog(catalog, categoryId = '', limit = 50) {
        let result = Array.isArray(catalog) ? [...catalog] : [];
        if (categoryId) {
            result = result.filter(item => {
                const cat = (item.categoryId || item.category || '').toLowerCase();
                return cat.includes(categoryId.toLowerCase());
            });
        }
        result.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return (a.name || '').localeCompare(b.name || '', 'tr');
        });
        return result.slice(0, limit);
    }
};

// Worker'ı Main Thread'e aç
Comlink.expose(NeuralEngine);
