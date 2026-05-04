import type { TelemetryPayload } from "../../../../server/core/concierge/telemetry/telemetry.contract";
import type { RevenueDecision } from "../revenue/revenue.types";
import { resolveRevenueDecision } from "../revenue/revenue-decision-engine";
import { randomUUID } from "crypto";

export class IntentEngine {
  // O(1) erişim için In-Memory State
  private static decisions = new Map<string, RevenueDecision>();

  /**
   * Telemetri verisini analiz eder ve bir karar üretir.
   * Fire-and-forget çalıştığı için void döner.
   */
  static async evaluateIntent(payload: TelemetryPayload): Promise<void> {
    try {
      // 1. Asenkron/Non-blocking operasyon simülasyonu
      // İleride Redis veya I/O bound bir işlem eklendiğinde Node thread'i bloklanmamalı
      await new Promise(resolve => setImmediate(resolve));

      const { event, context } = payload;
      const sessionId = context.sessionId;

      if (!sessionId) {
        return; // SessionID yoksa track edemeyiz
      }

      let baseValue = 0.0;
      let confidence = 0.5;
      let hesitationIndex = 0;

      // Basit kural motoru (İleride JSON scoring table'a taşınacak)
      if (event === 'QUOTE_REQUESTED') {
        baseValue = 0.08; // %8 artış potansiyeli
        confidence = 0.95;
      } else if (event === 'SLOT_SELECTED') {
        baseValue = 0.05; // %5 artış potansiyeli
        confidence = 0.80;
      } else if (event === 'FLOW_ABANDONED') {
        hesitationIndex = 100; // Kullanıcı terk ediyor, upsell kapatılmalı
        confidence = 0.90;
      }

      // 2. Eğer anlamlı bir sinyal yakaladıysak karar üret
      if (baseValue > 0 || hesitationIndex > 0) {
        const decision = resolveRevenueDecision({
          decisionId: randomUUID(),
          sessionId,
          baseValue,
          confidence,
          impactWeight: 1.0,    // Tam etki
          successRate: 1.0,     // Şimdilik %100 başarı varsayıyoruz, wave-memory ile entegre edilebilir
          feedbackScore: 1.0,   // Pozitif feedback
          hesitationIndex
        });

        if (decision) {
          // State güncelleme
          this.decisions.set(sessionId, decision);

          console.log(JSON.stringify({
            level: 'info',
            event: 'INTENT_DECISION_CREATED',
            sessionId,
            action: decision.action,
            finalValue: decision.finalValue
          }));
        }
      }
    } catch (error) {
      console.error(JSON.stringify({ level: 'error', event: 'INTENT_ENGINE_ERROR', error: error instanceof Error ? error.message : String(error) }));
    }
  }

  /**
   * Belirtilen oturum için aktif kararı döndürür.
   */
  static getDecision(sessionId: string): RevenueDecision | undefined {
    return this.decisions.get(sessionId);
  }
}
