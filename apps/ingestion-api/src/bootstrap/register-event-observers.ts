/**
 * SANTIS OS — Event Observer Registration
 * @description Registers the sovereign event observer on the bus.
 * Idempotency-guarded: throws if called more than once to prevent duplicate
 * EventStore writes, WS broadcasts, and SSE patches.
 *
 * All deps injected — no module-level singletons accessed directly.
 */

import { WebSocket, WebSocketServer } from "ws";
import type { SovereignBus } from "@santis/sovereign-bus";
import type { SantisEventEnvelope, EventPayloadRecord } from "../types.js";
import type { SantisEvent } from "@santis/event-dictionary";
import { evaluateConciergeRules, deriveSignalFromDecision } from "../decision-kernel.js";
import { broadcastToGodMode } from "../routes/sse-streams.js";
import type { SseManager } from "../services/sse-manager.js";

export type ObserverDeps = {
  bus: SovereignBus;
  wss: WebSocketServer;
  sseManager: SseManager;
  eventStore: {
    append: (event: SantisEvent) => Promise<void>;
  };
};

// Idempotency guard — prevents duplicate observer registration on hot reload
let observersRegistered = false;

export function registerEventObservers(deps: ObserverDeps): void {
  if (observersRegistered) {
    throw new Error(
      "[Runtime] registerEventObservers() called more than once. This is a critical bootstrap error — check index.ts orchestration."
    );
  }
  observersRegistered = true;

  const { bus, wss, sseManager, eventStore } = deps;

  bus.addObserver({
    onEventPublished: async (event) => {
      // 1. Immutable append to EventStore
      await eventStore.append(event).catch((err) =>
        console.error("🚨 [Event Store] Kritik Yazma Hatası!", err)
      );

      // 2. Decision kernel evaluation
      const payloadData = (event.payload || {}) as EventPayloadRecord;
      const metrics = {
        hesitation_index: Number(payloadData.hesitation_index || 0),
        abandon_risk: Number(payloadData.abandon_risk || 0),
        stress_index: Number(payloadData.stress_index || 0),
        therapist_stress: Number(payloadData.therapist_stress || 0),
      };

      const decision = evaluateConciergeRules(metrics);
      const signalType = deriveSignalFromDecision(decision);

      // 3. God Mode Radar broadcast
      broadcastToGodMode("EVENT_STREAM", { ...event, signalType, decision });

      // 4. WebSocket broadcast — type-based payload mapping
      const evtType =
        (event as SantisEventEnvelope).eventType || (event as SantisEventEnvelope).type;

      let wsPayloadType = "TELEMETRY";
      let wsPayloadValue: unknown = 1;

      if (
        evtType === "GuestCheckoutCompleted" ||
        evtType === "RevenueGenerated" ||
        evtType === "commerce.upsell.therapist_accepted" ||
        evtType === "commerce.checkout.completed"
      ) {
        wsPayloadType = "REVENUE_UPDATE";
        // Sovereign Truth: payload'da gerçek tutar yoksa 0 döner.
        // Math.random() ile sahte revenue üretmek Boardroom kararlarını bozar. [ARCH-02]
        wsPayloadValue =
          payloadData.totalAmount ??
          payloadData.amount ??
          payloadData.revenue ??
          payloadData.upsellAmount ??
          0;
      } else if (decision.includes("risk") || decision.includes("escalate")) {
        wsPayloadType = "RISK_SIGNAL";
        wsPayloadValue = Math.floor(metrics.abandon_risk * 100) || 85;
      } else if (evtType === "boardroom.oracle.executed") {
        wsPayloadType = "ORACLE_LOOPBACK_ACK";
        wsPayloadValue = payloadData.actionId || 1;
      } else if (evtType === "boardroom.strategy.applied") {
        wsPayloadType = "STRATEGY_APPLY_ACK";
        wsPayloadValue =
          payloadData.recommendationId || payloadData.sessionId || "strategy-unknown";
      } else if (evtType === "pricing.recommendation.created") {
        wsPayloadType = "ACTION_RAIL_UPDATE";
        wsPayloadValue = payloadData.id || 1;
      }

      const wsMessage = JSON.stringify({
        type: wsPayloadType,
        message: `Olay: ${evtType} (${signalType})`,
        payload: { value: wsPayloadValue },
        value: wsPayloadValue,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(wsMessage);
        }
      });

      // 5. SSE Core-State broadcast (Zero-Drift Feed)
      if (
        ["REVENUE_UPDATE", "RISK_SIGNAL", "STRATEGY_APPLY_ACK", "ACTION_RAIL_UPDATE"].includes(
          wsPayloadType
        )
      ) {
        const scope: Parameters<typeof sseManager.broadcastPatch>[0] =
          wsPayloadType === "STRATEGY_APPLY_ACK"
            ? "strategy"
            : wsPayloadType === "ACTION_RAIL_UPDATE"
            ? "action_rail"
            : "revenue";

        sseManager.broadcastPatch(scope, {
          value: wsPayloadValue,
          eventType: evtType,
          occurredAt: event.occurredAt,
          traceId: event.traceId,
        });
      }
    },
  });
}
