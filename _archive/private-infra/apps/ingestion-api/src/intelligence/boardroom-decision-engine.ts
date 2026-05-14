import type {
  BoardroomRecommendation
} from "./boardroom-intelligence.types.js";

type CoreStateInput = {
  sessionId: string;
  hesitationIndex: number;
  conciergeMode: "silent" | "suggest" | "handoff";
  boardroom: {
    demandLevel: "low" | "normal" | "high";
    vipSessions: number;
    hesitationAlerts: number;
    revenueToday: number;
  };
};

export function resolveBoardroomRecommendations(
  state: CoreStateInput
): BoardroomRecommendation[] {
  const recommendations: BoardroomRecommendation[] = [];
  const now = new Date().toISOString();

  if (state.hesitationIndex >= 70) {
    recommendations.push({
      id: `rec_${state.sessionId}_hesitation`,
      sessionId: state.sessionId,
      severity: state.hesitationIndex >= 85 ? "critical" : "high",
      reason: "high_hesitation",
      action: "handoff_to_human",
      confidence: Math.min(0.98, state.hesitationIndex / 100),
      impactWeight: 0.85,
      message: "High hesitation detected. Recommend concierge handoff.",
      createdAt: now
    });
  }

  if (state.boardroom.demandLevel === "high") {
    recommendations.push({
      id: `rec_${state.sessionId}_demand`,
      sessionId: state.sessionId,
      severity: "medium",
      reason: "demand_spike",
      action: "suggest_price_increase",
      confidence: 0.82,
      impactWeight: 0.72,
      message: "Demand level is high. Recommend controlled price increase.",
      createdAt: now
    });
  }

  if (state.boardroom.vipSessions > 0 && state.conciergeMode === "handoff") {
    recommendations.push({
      id: `rec_${state.sessionId}_vip`,
      sessionId: state.sessionId,
      severity: "high",
      reason: "vip_exception",
      action: "lock_recommendation",
      confidence: 0.9,
      impactWeight: 0.8,
      message: "VIP session in handoff mode. Lock current recommendation.",
      createdAt: now
    });
  }

  return recommendations;
}
