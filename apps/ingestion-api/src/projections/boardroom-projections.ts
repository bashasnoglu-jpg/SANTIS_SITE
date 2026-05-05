import type { SovereignBus } from "@santis/sovereign-bus";
import type { SantisEvent } from "@santis/event-dictionary";
import { calculateSCP } from "@santis/application/engines/scp-engine";
import type { ActionRecommendation } from "@santis/domain-schema";

import crypto from "crypto";
import { computeCalibration, segmentConfidence } from "./calibration-engine";

type PricingRecommendationRecord = {
  id: string;
  sessionId: string;
  action: string;
  suggestedDeltaPct: number;
  confidence: number;
  reasonCodes: string[];
  status?: "approved" | "rejected";
  appliedDeltaPct?: number;
};

type PricingRecommendationAction =
  | "increase_price"
  | "hold_price"
  | "add_value_upgrade"
  | "suppress_discount";

type PricingReasonCode =
  | "high_scp_margin"
  | "low_scp_margin"
  | "premium_intent"
  | "vip_signal"
  | "low_hesitation"
  | "high_hesitation"
  | "capacity_pressure"
  | "low_demand"
  | "discount_risk"
  | "luxury_brand_guard";

type PricingRecommendationEvent = Extract<
  SantisEvent,
  { eventType: "pricing.recommendation.created" | "pricing.autonomous.recommended" }
>;

type CalibrationSnapshot = {
  matchRate: number;
  calibrationError: number;
} | null;

type OracleMemoryRecord = {
  id: string;
  intent: string;
  operatorId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export function derivePricingRecommendation(input: {
  scp: { score: number; margin: number; grossRevenue: number; [key: string]: unknown };
  calibration?: CalibrationSnapshot;
  demandIndex?: number;
  hesitationIndex?: number;
  capacityUtilization?: number;
  vipSignal?: boolean;
  stabilityFactor?: number;
}) {
  const {
    scp,
    calibration,
    demandIndex = 0.5,
    hesitationIndex = 0.5,
    capacityUtilization = 0.5,
    vipSignal = false,
    stabilityFactor = 0.9
  } = input;

  let action: PricingRecommendationAction = "hold_price";
  let delta = 0;
  let reasons: PricingReasonCode[] = [];

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

  const brandRisk: "low" | "medium" | "high" =
    delta > 0.15 ? "high" :
    delta > 0.08 ? "medium" :
    "low";

  const luxuryIntegrity = brandRisk !== "high" && stabilityFactor >= 0.7;

  let mode: "advisory" | "autonomous_ready" = "advisory";
  let autonomousReady = false;
  let requiresHumanSeal = true;

  if (calibration && calibration.matchRate > 0.80 && calibration.calibrationError < 0.10 && brandRisk === "low") {
    mode = "autonomous_ready";
    autonomousReady = true;
  }

  return {
    action,
    suggestedDeltaPct: Math.min(delta, 0.2),
    confidence: Math.min(confidence, 1),
    reasonCodes: reasons,
    mode,
    autonomousReady,
    requiresHumanSeal,
    guardrails: {
      requiresHumanApproval: true as const,
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
    currency: "EUR",
    hourlyRateTarget: 150,
    lastUpdateTraceId: null as string | null
  },
  sessions: {} as Record<string, {
    active: boolean;
    hesitationIndex: number;
    stressIndex: number;
    conversionRisk: "low" | "medium" | "high";
    lastActivity: string;
  }>,
  moodHeatmap: {
    deep_relaxation: 0,
    recovery: 0,
    detox: 0,
    beauty: 0,
    couple_connection: 0
  },
  pricingRecommendations: {} as Record<string, PricingRecommendationRecord>,
  activeActions: [] as ActionRecommendation[], // 🔥 Typed: Boardroom Action Rail
  latestCalibration: null as CalibrationSnapshot,
  oracleIntelligence: {
    actionsResolved: 0,
    lastOperatorAction: null as OracleMemoryRecord | null,
    actionMemory: [] as OracleMemoryRecord[]
  },

  // --- SOVEREIGN MEMORY (Phase 79) ---
  auditLog: [] as {
    id: string;
    type: "action.approved" | "action.rejected";
    actionId: string;
    operatorId: string;
    traceId: string;
    reason?: string;
    payload?: any;
    occurredAt: string;
  }[],
  
  snapshots: [] as {
    timestamp: string;
    revenue: number;
    activeSessionsCount: number;
    resolvedActionId: string;
  }[],

  // --- COGNITIVE GOVERNOR (Phase 81) ---
  cognitiveInsights: [] as CognitiveInsight[],

  therapists: [
    { id: "th-01", name: "Elena", specialty: "Ayurveda & Detox", status: "busy", sessionsToday: 4, stressIndex: 0.15 },
    { id: "th-02", name: "Marcus", specialty: "Deep Tissue & Sports", status: "ready", sessionsToday: 2, stressIndex: 0.05 },
    { id: "th-03", name: "Selin", specialty: "Hamam Master & Scrub", status: "ready", sessionsToday: 5, stressIndex: 0.25 },
    { id: "th-04", name: "David", specialty: "Bio-Energy & Reiki", status: "break", sessionsToday: 1, stressIndex: 0.10 }
  ],

  // 📖 CANONICAL CATALOG (Sovereign Service Dictionary)
  catalog: {
    programs: [
      { id: "pr-01", title: "Sovereign Recovery", duration: "180 min", price: 450 },
      { id: "pr-02", title: "Deep Silence Retreat", duration: "120 min", price: 320 }
    ],
    hammam: [
      { id: "hm-01", title: "Traditional Ottoman Ritual", duration: "60 min", price: 120 },
      { id: "hm-02", title: "Santis Signature Scrub", duration: "45 min", price: 95 }
    ],
    massages: [
      { id: "ms-01", title: "Quiet Luxury Massage", duration: "90 min", price: 180 },
      { id: "ms-02", title: "Nordic Recovery", duration: "60 min", price: 140 }
    ],
    skincare: [
      { id: "sk-01", title: "Sothys Hydrating Fluid", duration: "60 min", price: 160 },
      { id: "sk-02", title: "Sovereign Glow", duration: "45 min", price: 130 }
    ],
    extras: [
      { id: "ex-01", title: "CBD Oil Upgrade", price: 25 },
      { id: "ex-02", title: "Hot Stone Add-on", price: 35 }
    ]
  }
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

  // 📡 TELEMETRY PROJECTION (Zero-Drift Intent Tracking)
  if (event.eventType === "telemetry.event_captured") {
    const { sessionId } = event;
    const { hesitationIndex = 0, stressIndex = 0 } = event.payload;
    
    if (!BoardroomReadModels.sessions[sessionId]) {
      BoardroomReadModels.sessions[sessionId] = {
        active: true,
        hesitationIndex: 0,
        stressIndex: 0,
        conversionRisk: "low",
        lastActivity: new Date().toISOString()
      };
    }

    const session = BoardroomReadModels.sessions[sessionId];
    session.hesitationIndex = hesitationIndex;
    session.stressIndex = stressIndex;
    session.lastActivity = event.occurredAt;

    // Derived Logic
    if (hesitationIndex > 0.7) session.conversionRisk = "high";
    else if (hesitationIndex > 0.4) session.conversionRisk = "medium";
    else session.conversionRisk = "low";
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

import { sseManager } from "../services/sse-manager.js";

/**
 * 📡 PROJECTION SUBSCRIBERS (Event Dinleyicileri)
 */
export const registerBoardroomProjections = (bus: SovereignBus) => {
  console.log("📈 [Projections] Boardroom Dinleyicileri Aktif.");

  // Canlı (Live) eventleri dinle ve projeksiyona uygula
  bus.events.subscribe("experience.interaction.mood_selected", async (e) => {
    projectEvent(e);
  });

  bus.events.subscribe("telemetry.event_captured", async (e) => {
    projectEvent(e);
    
    // Broadcast live telemetry update
    sseManager.broadcastPatch("core_state", {
      sessions: BoardroomReadModels.sessions
    });
  });
  
  bus.events.subscribe("commerce.upsell.therapist_accepted", async (e) => {
    projectEvent(e);
    
    // Broadcast live delta to the Boardroom PRO Cockpit
    sseManager.broadcastPatch("core_state", {
      totalRevenue: BoardroomReadModels.revenueMetrics.totalRevenue,
      bookingCount: Math.floor(BoardroomReadModels.revenueMetrics.totalRevenue / 1500), // Mock booking count for now
    });
  });

  bus.events.subscribe("commerce.checkout.completed", async (e) => {
    projectEvent(e);
    
    const scp = calculateSCP({
      totalAmount: e.payload.totalAmount,
      services: e.payload.services || []
    });

    // 1. Broadcast SCP live patch
    sseManager.broadcastPatch("core_state", {
      boardroom: {
        metrics: {
          totalRevenue: BoardroomReadModels.revenueMetrics.totalRevenue,
          scp
        }
      }
    });

    const pricing = derivePricingRecommendation({
      scp,
      calibration: BoardroomReadModels.latestCalibration,
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
      eventType: recommendationPayload.mode === "autonomous_ready" ? "pricing.autonomous.recommended" : "pricing.recommendation.created",
      payload: recommendationPayload
    });
  });

  function deriveShadowDecision(pricingRecommendation: PricingRecommendationRecord) {
    return {
      recommendationId: pricingRecommendation.id,
      simulatedAction: pricingRecommendation.action,
      simulatedDeltaPct: pricingRecommendation.suggestedDeltaPct,
      confidence: pricingRecommendation.confidence,
      trigger: pricingRecommendation.reasonCodes?.[0] || "pricing_recommendation",
      expectedOutcome: {
        expectedRevenueDelta: pricingRecommendation.suggestedDeltaPct * 0.7,
        expectedScpDelta: pricingRecommendation.suggestedDeltaPct * 0.5
      }
    };
  }

  // 3. Render pricing intelligence in UI
  const handleRecommendation = async (e: PricingRecommendationEvent) => {
    BoardroomReadModels.pricingRecommendations[e.sessionId] = e.payload;
    
    const shadow = deriveShadowDecision(e.payload);
    const shadowPricing = {
      ...shadow,
      id: crypto.randomUUID(),
      sessionId: e.sessionId,
      traceId: e.traceId,
      createdAt: new Date().toISOString()
    };

    // 🔥 Action Rail Integration
    const actionId = e.payload.id || crypto.randomUUID();
    const actionItem: ActionRecommendation = {
      id: actionId,
      type: "pricing_adjustment",
      title: `Fiyat Optimizasyonu: ${e.payload.action}`,
      description: `${(e.payload.suggestedDeltaPct * 100).toFixed(1)}% değişim öneriliyor. Neden: ${e.payload.reasonCodes?.join(", ")}`,
      impactScore: e.payload.confidence,
      priority: e.payload.confidence > 0.8 ? "high" : "medium",
      expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      payload: e.payload,
      createdAt: new Date().toISOString()
    };

    // Add to active actions if not already there
    if (!BoardroomReadModels.activeActions.find(a => a.id === actionId)) {
      BoardroomReadModels.activeActions.unshift(actionItem);
      // Limit to 20 active actions
      if (BoardroomReadModels.activeActions.length > 20) BoardroomReadModels.activeActions.pop();
    }

    sseManager.broadcastPatch("core_state", {
      boardroom: {
        pricingRecommendations: BoardroomReadModels.pricingRecommendations,
        activeActions: BoardroomReadModels.activeActions,
        pricingRecommendation: e.payload, 
        shadowPricing: shadowPricing
      }
    });

    // Also notify the specific action_rail scope
    sseManager.broadcastPatch("action_rail", {
      type: "new_recommendation",
      action: actionItem
    });
  };

  bus.events.subscribe("pricing.recommendation.created", handleRecommendation);
  bus.events.subscribe("pricing.autonomous.recommended", handleRecommendation);

  function deriveCurrentCalibration() {
    const pairs = Object.values(BoardroomReadModels.pricingRecommendations)
      .filter((r) => r.status && (r.status === 'approved' || r.status === 'rejected'))
      .map((r) => ({
        confidence: r.confidence || 0,
        match: r.status === 'approved'
      }));
    
    const calibration = computeCalibration(pairs);
    BoardroomReadModels.latestCalibration = calibration;
    return calibration;
  }

  // 4. Operator Override Applied
  bus.events.subscribe("pricing.override.applied", async (e) => {
    const sessionId = e.sessionId;
    const recommendation = BoardroomReadModels.pricingRecommendations[sessionId];
    
    if (recommendation) {
      BoardroomReadModels.pricingRecommendations[sessionId] = {
        ...recommendation,
        status: e.payload.decision === "reject" ? "rejected" : "approved",
        appliedDeltaPct: e.payload.appliedDeltaPct
      };
    }

    // 🔥 Remove from Action Rail
    const recommendationId = recommendation?.id || e.payload.recommendationId;
    if (recommendationId) {
      BoardroomReadModels.activeActions = BoardroomReadModels.activeActions.filter(
        a => a.id !== recommendationId && a.payload?.id !== recommendationId
      );
    }

    const calibration = deriveCurrentCalibration();

    sseManager.broadcastPatch("core_state", {
      boardroom: {
        pricingRecommendations: BoardroomReadModels.pricingRecommendations,
        activeActions: BoardroomReadModels.activeActions,
        pricingOverride: e.payload, // Keep for backward compatibility
        calibration
      }
    });
  });

  // 5. Oracle Action Resolved (Boardroom Loop-back Projection)
  bus.events.subscribe("boardroom.oracle.executed", async (e) => {
    const memoryRecord: OracleMemoryRecord = {
      id: e.payload.actionId,
      intent: e.payload.actionType,
      operatorId: e.payload.operatorId,
      timestamp: e.payload.executedAt,
      metadata: e.payload.metadata,
    };
    BoardroomReadModels.oracleIntelligence.actionsResolved += 1;
    BoardroomReadModels.oracleIntelligence.lastOperatorAction = memoryRecord;
    
    // Keep last 10 actions in memory
    BoardroomReadModels.oracleIntelligence.actionMemory.unshift(memoryRecord);
    if (BoardroomReadModels.oracleIntelligence.actionMemory.length > 10) {
      BoardroomReadModels.oracleIntelligence.actionMemory.pop();
    }

    console.log(`🧠 [Projection: Oracle] Operator Action Resolved: ${e.payload.actionType} | Total: ${BoardroomReadModels.oracleIntelligence.actionsResolved}`);

    sseManager.broadcastPatch("core_state", {
      boardroom: {
        oracleIntelligence: BoardroomReadModels.oracleIntelligence
      }
    });
  });

  bus.events.subscribe("boardroom.strategy.applied", async (e) => {
    const operatorId = e.payload.operatorContext?.operatorId || e.payload.operatorContext?.source || "boardroom-ui";
    const memoryRecord = {
      id: e.payload.recommendationId,
      intent: `strategy_${e.payload.decision}`,
      operatorId,
      timestamp: e.payload.appliedAt,
      metadata: {
        strategy: e.payload.strategy,
        meta: e.payload.meta,
      },
    };

    BoardroomReadModels.oracleIntelligence.actionsResolved += 1;
    BoardroomReadModels.oracleIntelligence.lastOperatorAction = memoryRecord;
    BoardroomReadModels.oracleIntelligence.actionMemory.unshift(memoryRecord);

    if (BoardroomReadModels.oracleIntelligence.actionMemory.length > 10) {
      BoardroomReadModels.oracleIntelligence.actionMemory.pop();
    }

    sseManager.broadcastPatch("core_state", {
      boardroom: {
        oracleIntelligence: BoardroomReadModels.oracleIntelligence,
        strategyApply: e.payload,
      }
    });
  });

  // --- ACTION RAIL COMMAND RESOLVERS (Phase 78) ---

  /**
   * Simülasyon Onayı: Aksiyonu listeden kaldır, hafızaya mühürle ve UI'yı güncelle
   */
  bus.events.subscribe("action.approval.simulated", async (e) => {
    const { actionId } = e.payload;
    console.log(`✅ [Projection: ActionRail] Action Simulated Approved: ${actionId}`);

    // 1. Memory Seal (Audit Log)
    const auditEntry = {
        id: crypto.randomUUID(),
        type: "action.approved" as const,
        actionId,
        operatorId: e.payload.operatorId || "system",
        traceId: e.traceId,
        reason: e.payload.note,
        payload: e.payload,
        occurredAt: new Date().toISOString()
    };
    BoardroomReadModels.auditLog.unshift(auditEntry);
    if (BoardroomReadModels.auditLog.length > 50) BoardroomReadModels.auditLog.pop();

    // 2. Snapshot (Time-Travel için durum kaydı)
    BoardroomReadModels.snapshots.unshift({
        timestamp: auditEntry.occurredAt,
        revenue: BoardroomReadModels.revenueMetrics.totalRevenue,
        activeSessionsCount: Object.values(BoardroomReadModels.sessions).filter(s => s.active).length,
        resolvedActionId: actionId
    });

    // 3. Projeksiyonu güncelle: Aksiyonu listeden çıkar
    BoardroomReadModels.activeActions = BoardroomReadModels.activeActions.filter(a => a.id !== actionId);

    // 4. Tüm ekranlara fısılda (Patch)
    const patch = { 
        activeActions: BoardroomReadModels.activeActions,
        resolvedActionId: actionId,
        resolutionType: "approved_simulated",
        auditLog: BoardroomReadModels.auditLog
    };

    sseManager.broadcastPatch("core_state", { boardroom: patch });
    sseManager.broadcastPatch("action_rail", { type: "action_resolved", ...patch });
    
    // 🔥 Phase 81: Compute Cognitive Insights after state change
    computeCognitiveInsights();
  });

  /**
   * Aksiyon Reddi: Aksiyonu listeden kaldır, hafızaya mühürle ve UI'yı güncelle
   */
  bus.events.subscribe("pricing.recommendation.rejected", async (e) => {
    const { actionId } = e.payload;
    console.log(`❌ [Projection: ActionRail] Action Rejected: ${actionId}`);

    // 1. Memory Seal (Audit Log)
    const auditEntry = {
        id: crypto.randomUUID(),
        type: "action.rejected" as const,
        actionId,
        operatorId: e.payload.operatorId || "system",
        traceId: e.traceId,
        reason: "User manual rejection",
        payload: e.payload,
        occurredAt: new Date().toISOString()
    };
    BoardroomReadModels.auditLog.unshift(auditEntry);

    // 2. Projeksiyonu güncelle
    BoardroomReadModels.activeActions = BoardroomReadModels.activeActions.filter(a => a.id !== actionId);

    const patch = { 
        activeActions: BoardroomReadModels.activeActions,
        resolvedActionId: actionId,
        resolutionType: "rejected",
        auditLog: BoardroomReadModels.auditLog
    };

    sseManager.broadcastPatch("core_state", { boardroom: patch });
    sseManager.broadcastPatch("action_rail", { type: "action_resolved", ...patch });
    
    // 🔥 Phase 81: Compute Cognitive Insights after state change
    computeCognitiveInsights();
  });
};

import { CognitiveGovernor, CognitiveInsight } from "../services/cognitive-governor";

function computeCognitiveInsights() {
    console.log("🧠 [CognitiveGovernor] Analyzing historical patterns for new insights...");
    
    const currentState = {
        revenue: BoardroomReadModels.revenueMetrics.totalRevenue,
        activeSessionsCount: Object.values(BoardroomReadModels.sessions).filter(s => s.active).length
    };

    const insights = CognitiveGovernor.analyze(
        currentState,
        BoardroomReadModels.auditLog,
        BoardroomReadModels.snapshots
    );

    BoardroomReadModels.cognitiveInsights = insights;

    // Broadcast the new wisdom
    sseManager.broadcastPatch("action_rail", {
        type: "cognitive_insights_update",
        insights: BoardroomReadModels.cognitiveInsights
    });
}


