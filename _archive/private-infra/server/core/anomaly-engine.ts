/**
 * SANTIS Sovereign OS - Anomaly & Advisory Engine
 * Sprint D: Advisory Action Engine
 */

import {
  createRevenueAdvisorySuggestion,
} from "./revenue-engine.ts";
import { AdvisoryStore } from "./advisory-store.js";
import type { AdvisorySuggestion } from "./telemetry.ts";

export const AnomalyEngine = {
    /**
     * Gelen verileri analiz eder ve Boardroom için aksiyon fısıldar (Oracle).
     */
    analyze(data: any): AdvisorySuggestion | null {
        
        // ORACLE WHISPER A: REVENUE INTELLIGENCE (Golden Path)
        if (data.subject === "GUEST_GENOME" && data.metrics?.baliMassageViews > 100 && data.metrics?.conversionRate < 0.02) {
            const suggestion = createRevenueAdvisorySuggestion({
                ritualId: "bali-highlight",
                multiplier: 0.95,
                recommendation: "Misafirler Bali masajına çok bakıyor ama rezervasyon yapmıyor. Fiyatı %5 optimize (Surge) edelim mi?",
                riskScore: 0.15,
            });

            if (suggestion && AdvisoryStore?.push) {
                AdvisoryStore.push(suggestion, {
                    source: "anomaly-engine.guest-genome",
                    context: {
                        baliMassageViews: data.metrics?.baliMassageViews,
                        conversionRate: data.metrics?.conversionRate,
                    },
                });
            }

            return suggestion;
        }

        return null;
    }
};
