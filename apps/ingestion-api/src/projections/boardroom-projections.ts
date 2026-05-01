import type { SovereignBus } from "@santis/sovereign-bus";
import type { SantisEvent } from "@santis/event-dictionary";
import { calculateSCP } from "@santis/application/engines/scp-engine";

import crypto from "crypto";
import { computeCalibration, segmentConfidence } from "./calibration-engine";
export function derivePricingRecommendation(input: {
  scp: any;
  demandIndex?: number;
  hesitationIndex?: number;
  capacityUtilization?: number;
  vipSignal?: boolean;
  stabilityFactor?: number;
}) {
  const {
    scp,
    demandIndex = 0.5,
    hesitationIndex = 0.5,
    capacityUtilization = 0.5,
    vipSignal = false,
    stabilityFactor = 0.9
  } = input;

  let action = "hold_price";
  let delta = 0;
  let reasons: string[] = [];

  // 🔥 CORE DECISION LOGIC

  if (scp.margin > 0.6) {
    action = "increase_price";
    delta = 0.12;
    reasons.push("high_scp_margin");
  }

  if (vipSignal) {
    delta += 0.05;
    reasons.push("vip_signal");
  }

  if (capacityUtilization > 0.8) {
    delta += 0.03;
    reasons.push("capacity_pressure");
  }

  if (hesitationIndex > 0.7) {
    action = "add_value_upgrade";
    delta = 0;
    reasons.push("high_hesitation");
  }

  // 🧠 CONFIDENCE MODEL

  const confidence =
    (scp.margin * 0.3) +
    ((1 - hesitationIndex) * 0.2) +
    (capacityUtilization * 0.2) +
    (stabilityFactor * 0.2) +
    (vipSignal ? 0.1 : 0);

  // 🎯 GUARDRAILS

  const brandRisk =
    delta > 0.15 ? "high" :
    delta > 0.08 ? "medium" :
    "low";

  const luxuryIntegrity = brandRisk !== "high" && stabilityFactor >= 0.7;

  return {
    action,
    suggestedDeltaPct: Math.min(delta, 0.2),
    confidence: Math.min(confidence, 1),
    reasonCodes: reasons,
    guardrails: {
      requiresHumanApproval: true,
      maxDeltaPct: 0.2,
      brandRisk,
      luxuryIntegrity,
      expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString()
    }
  };
}


/**
 * 📊 IN-MEMORY READ MODELS (Projections)
 * Gerçekte bu veriler Redis'e veya MongoDB'nin hızlı bir View koleksiyonuna yazılır.
 * Okuma işlemleri her zaman 0ms sürer çünkü veri önden hesaplanmıştır!
 */
export const BoardroomReadModels = {
  revenueMetrics: {
    totalRevenue: 0,
    dailyTarget: 50000,
    trend: "neutral" as "up" | "down" | "neutral",
    delta: 0,
    lastUpdateTraceId: null as string | null
  },
  moodHeatmap: {
    deep_relaxation: 0,
    recovery: 0,
    detox: 0,
    beauty: 0,
    couple_connection: 0
  },
  pricingRecommendations: {} as Record<string, any>
};

/**
 * MİMARİ SIR: Hem canlı akan veriyi hem de geçmişten gelen (Replay) veriyi 
 * tek bir merkezden projeksiyonlara yansıtan Hydrator motoru.
 */
export const projectEvent = (event: SantisEvent) => {
  if (event.eventType === "experience.interaction.mood_selected") {
    const mood = event.payload.mood;
    if (BoardroomReadModels.moodHeatmap[mood as keyof typeof BoardroomReadModels.moodHeatmap] !== undefined) {
      BoardroomReadModels.moodHeatmap[mood as keyof typeof BoardroomReadModels.moodHeatmap] += 1;
      console.log(`🔥 [Projection: Mood] Isı haritası güncellendi: ${mood} (${BoardroomReadModels.moodHeatmap[mood as keyof typeof BoardroomReadModels.moodHeatmap]})`);
    }
  }

  if (event.eventType === "commerce.upsell.therapist_accepted") {
    const amount = event.payload.upsellAmount;
    updateRevenue(amount, event.traceId);
  }

  if (event.eventType === "commerce.checkout.completed") {
    const amount = event.payload.totalAmount;
    updateRevenue(amount, event.traceId);
  }
};

function updateRevenue(amount: number, traceId: string) {
    const previousRevenue = BoardroomReadModels.revenueMetrics.totalRevenue;
    BoardroomReadModels.revenueMetrics.totalRevenue += amount;
    
    if (previousRevenue > 0) {
      BoardroomReadModels.revenueMetrics.delta = parseFloat(((amount / previousRevenue) * 100).toFixed(1));
      BoardroomReadModels.revenueMetrics.trend = "up";
    }
    BoardroomReadModels.revenueMetrics.lastUpdateTraceId = traceId;
    console.log(`💰 [Projection: Revenue] Kasa güncellendi: +€${amount}. Toplam: €${BoardroomReadModels.revenueMetrics.totalRevenue}`);
}

import { broadcastCoreStatePatch } from "../routes/core-state-stream";

/**
 * 📡 PROJECTION SUBSCRIBERS (Event Dinleyicileri)
 */
export const registerBoardroomProjections = (bus: SovereignBus) => {
  console.log("📈 [Projections] Boardroom Dinleyicileri Aktif.");

  // Canlı (Live) eventleri dinle ve projeksiyona uygula
  bus.events.subscribe("experience.interaction.mood_selected", async (e: any) => {
    projectEvent(e);
  });
  
  bus.events.subscribe("commerce.upsell.therapist_accepted", async (e: any) => {
    projectEvent(e);
    
    // Broadcast live delta to the Boardroom PRO Cockpit
    broadcastCoreStatePatch({
      totalRevenue: BoardroomReadModels.revenueMetrics.totalRevenue,
      bookingCount: Math.floor(BoardroomReadModels.revenueMetrics.totalRevenue / 1500), // Mock booking count for now
    });
  });

  bus.events.subscribe("commerce.checkout.completed", async (e: any) => {
    projectEvent(e);
    
    const scp = calculateSCP({
      totalAmount: e.payload.totalAmount,
      services: e.payload.services || []
    });

    // 1. Broadcast SCP live patch
    broadcastCoreStatePatch({
      boardroom: {
        metrics: {
          totalRevenue: BoardroomReadModels.revenueMetrics.totalRevenue,
          scp
        }
      }
    });

    const pricing = derivePricingRecommendation({
      scp,
      demandIndex: 0.6,
      hesitationIndex: 0.3,
      capacityUtilization: 0.7,
      vipSignal: false,
      stabilityFactor: 0.85
    });

    const recommendationPayload = {
      ...pricing,
      id: crypto.randomUUID(),
      sessionId: e.sessionId || "session-unknown",
      traceId: e.traceId || crypto.randomUUID(),
      mode: "advisory",
      createdAt: new Date().toISOString(),
      evidence: {
        scpScore: scp.score,
        scpMargin: scp.margin,
        grossRevenue: scp.grossRevenue,
        vipSignal: false
      }
    };

    // 2. Emit Decision Artifact (Sovereign Audit Trail)
    await bus.events.publish({
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      tenant: e.tenant,
      intent: e.intent || "system_generated",
      traceId: e.traceId || crypto.randomUUID(),
      sessionId: e.sessionId,
      schemaVersion: "v1",
      eventType: "pricing.recommendation.emitted",
      payload: recommendationPayload
    } as any);
  });

  function deriveShadowDecision(pricingRecommendation: any) {
    return {
      simulatedAction: pricingRecommendation.action,
      simulatedDeltaPct: pricingRecommendation.suggestedDeltaPct,
      confidence: pricingRecommendation.confidence,
      expectedOutcome: {
        expectedRevenueDelta: pricingRecommendation.suggestedDeltaPct * 0.7,
        expectedScpDelta: pricingRecommendation.suggestedDeltaPct * 0.5
      }
    };
  }

  // 3. Render pricing intelligence in UI
  bus.events.subscribe("pricing.recommendation.emitted", async (e: any) => {
    BoardroomReadModels.pricingRecommendations[e.sessionId] = e.payload;
    
    const shadow = deriveShadowDecision(e.payload);
    const shadowPricing = {
      ...shadow,
      id: crypto.randomUUID(),
      sessionId: e.sessionId,
      traceId: e.traceId,
      createdAt: new Date().toISOString()
    };

    broadcastCoreStatePatch({
      boardroom: {
        pricingRecommendations: BoardroomReadModels.pricingRecommendations,
        pricingRecommendation: e.payload, // Keep for backward compatibility with old UI
        shadowPricing: shadowPricing
      }
    });
  });

  function deriveCurrentCalibration() {
    const pairs = Object.values(BoardroomReadModels.pricingRecommendations)
      .filter((r: any) => r.status && (r.status === 'approved' || r.status === 'rejected'))
      .map((r: any) => ({
        confidence: r.confidence || 0,
        match: r.status === 'approved'
      }));
    
    return computeCalibration(pairs);
  }

  // 4. Operator Override Applied
  bus.events.subscribe("pricing.override.applied", async (e: any) => {
    const sessionId = e.sessionId || e.payload.sessionId;
    const recommendation = BoardroomReadModels.pricingRecommendations[sessionId];
    
    if (recommendation) {
      BoardroomReadModels.pricingRecommendations[sessionId] = {
        ...recommendation,
        status: e.payload.decision.toLowerCase(),
        appliedDeltaPct: e.payload.appliedDeltaPct
      };
    }

    const calibration = deriveCurrentCalibration();

    broadcastCoreStatePatch({
      boardroom: {
        pricingRecommendations: BoardroomReadModels.pricingRecommendations,
        pricingOverride: e.payload, // Keep for backward compatibility
        calibration
      }
    });
  });
};
