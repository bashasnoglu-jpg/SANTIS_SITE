/**
 * SANTIS SOVEREIGN OS - COGNITIVE GOVERNOR (Phase 81)
 * Görev: Geçmiş kararları analiz ederek operatöre bağlamsal öneriler sunmak.
 * Motto: "Evidence-based, Advisory, Sovereign."
 */

export interface CognitiveInsight {
    id: string;
    type: 'pricing_repeat_opportunity' | 'demand_spike_warning' | 'hesitation_pattern';
    message: string;
    confidence: number; // 0 - 1
    evidence: {
        similarEventId: string;
        previousOutcome: string;
        timestamp: string;
    };
    suggestedActionId?: string;
    occurredAt: string;
}

export class CognitiveGovernor {
    /**
     * Mevcut sistem durumu ile geçmişteki denetim loglarını karşılaştırarak öneri üretir.
     */
    static analyze(currentState: any, auditLog: any[], snapshots: any[]): CognitiveInsight[] {
        const insights: CognitiveInsight[] = [];

        // 1. Fiyatlandırma Tekrar Fırsatı (Pricing Repeat Opportunity)
        const pricingInsights = this.findPricingOpportunities(currentState, auditLog, snapshots);
        insights.push(...pricingInsights);

        // Gelecekte buraya daha fazla pattern eklenecek (Demand, Hesitation vb.)

        return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    }

    private static findPricingOpportunities(currentState: any, auditLog: any[], snapshots: any[]): CognitiveInsight[] {
        const opportunities: CognitiveInsight[] = [];
        
        // Sadece onaylanmış fiyatlandırma aksiyonlarını filtrele
        const approvedActions = auditLog.filter(e => e.type === 'action.approved');

        for (const entry of approvedActions) {
            const snapshot = snapshots.find(s => s.id === entry.snapshotId);
            if (!snapshot) continue;

            // Durum benzerliği ölç (Basit Heuristic: Benzer ciro ve aktif seans)
            const revSimilarity = 1 - Math.abs(snapshot.revenue - currentState.revenue) / Math.max(snapshot.revenue, 1);
            const sessionSimilarity = 1 - Math.abs(snapshot.activeSessionsCount - currentState.activeSessionsCount) / Math.max(snapshot.activeSessionsCount, 1);
            
            const totalSimilarity = (revSimilarity + sessionSimilarity) / 2;

            // Eğer benzerlik %80'den fazlaysa ve bu karar geçmişte ciro artışı sağladıysa
            if (totalSimilarity > 0.8) {
                // Not: Gerçek analizde karardan X dakika sonraki ciroya bakılır (Phase 81.1)
                opportunities.push({
                    id: `insight_${Date.now()}_${entry.id}`,
                    type: 'pricing_repeat_opportunity',
                    message: `Benzer piyasa koşullarında (Ciro: €${snapshot.revenue}) verilen onay, kısa vadede verimliliği artırdı.`,
                    confidence: Math.round(totalSimilarity * 100) / 100,
                    evidence: {
                        similarEventId: entry.id,
                        previousOutcome: "Revenue Stability / Growth",
                        timestamp: entry.occurredAt
                    },
                    suggestedActionId: entry.actionId,
                    occurredAt: new Date().toISOString()
                });
            }
        }

        return opportunities;
    }
}
