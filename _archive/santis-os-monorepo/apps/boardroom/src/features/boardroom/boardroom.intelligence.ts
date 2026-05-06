import type {
  BoardroomFrictionView,
  BoardroomIntentView,
  BoardroomMetricView,
  BoardroomTherapistView,
  BoardroomVipView,
} from "./boardroom.adapter";

export type ScoreBand = "low" | "moderate" | "high" | "critical";

export type VipRiskScore = {
  id: string;
  guest: string;
  ritual: string;
  estimatedValue: string;
  urgency: "high" | "medium" | "low";
  score: number;
  band: ScoreBand;
  reasons: string[];
};

export type IntentGravityScore = {
  id: string;
  label: string;
  score: number;
  band: ScoreBand;
  momentum: "rising" | "stable" | "falling";
  interpretation: string;
};

export type TherapistStressScore = {
  id: string;
  name: string;
  margin: string;
  capacity: number;
  stressScore: number;
  band: ScoreBand;
  interpretation: string;
};

export type ConversionAnomaly = {
  key: string;
  title: string;
  severity: ScoreBand;
  score: number;
  interpretation: string;
};

export type BoardroomIntelligenceSnapshot = {
  vipRiskScores: VipRiskScore[];
  intentGravityScores: IntentGravityScore[];
  therapistStressScores: TherapistStressScore[];
  conversionAnomalies: ConversionAnomaly[];
  executiveSignals: string[];
};

type IntelligenceInput = {
  metrics: BoardroomMetricView[];
  intents: BoardroomIntentView[];
  frictionRows: BoardroomFrictionView[];
  therapists: BoardroomTherapistView[];
  vipItems: BoardroomVipView[];
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToBand(score: number): ScoreBand {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "moderate";
  return "low";
}

function parseNumeric(input: string): number {
  const normalized = input.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function metricNumber(metrics: BoardroomMetricView[], key: string): number {
  const found = metrics.find((m) => m.key === key);
  if (!found) return 0;
  return parseNumeric(found.value);
}

export function scoreVipAbandonRisk(
  vipItems: BoardroomVipView[],
  metrics: BoardroomMetricView[]
): VipRiskScore[] {
  const abandonmentLeak = metricNumber(metrics, "abandonment_leak");

  return vipItems.map((vip) => {
    let score = 20;
    const reasons: string[] = [];

    const value = parseNumeric(vip.estimatedValue);

    if (vip.urgency === "high") {
      score += 28;
      reasons.push("High urgency VIP session");
    } else if (vip.urgency === "medium") {
      score += 16;
      reasons.push("Medium urgency session");
    } else {
      score += 8;
      reasons.push("Low urgency session still unresolved");
    }

    if (value >= 800) {
      score += 24;
      reasons.push("High-value booking at risk");
    } else if (value >= 500) {
      score += 16;
      reasons.push("Meaningful booking value exposed");
    } else {
      score += 8;
      reasons.push("Lower value but still convertible");
    }

    if (/couples|sanctuary|signature|recovery/i.test(vip.ritual)) {
      score += 10;
      reasons.push("Premium ritual pattern historically sensitive to handoff delay");
    }

    if (abandonmentLeak >= 15) {
      score += 18;
      reasons.push("Global abandonment leak elevated");
    } else if (abandonmentLeak >= 10) {
      score += 10;
      reasons.push("Abandonment leak above comfort threshold");
    }

    score = clamp(score);

    return {
      id: vip.id,
      guest: vip.guest,
      ritual: vip.ritual,
      estimatedValue: vip.estimatedValue,
      urgency: vip.urgency,
      score,
      band: scoreToBand(score),
      reasons,
    };
  }).sort((a, b) => b.score - a.score);
}

export function scoreIntentGravity(
  intents: BoardroomIntentView[],
  frictionRows: BoardroomFrictionView[]
): IntentGravityScore[] {
  const totalFrictionSessions = frictionRows.reduce((sum, row) => sum + row.sessions, 0);

  return intents.map((intent) => {
    let score = intent.value;
    let momentum: IntentGravityScore["momentum"] = "stable";

    if (intent.trend === "up") {
      score += 12;
      momentum = "rising";
    } else if (intent.trend === "down") {
      score -= 12;
      momentum = "falling";
    }

    if (totalFrictionSessions >= 25) {
      score -= 8;
    } else if (totalFrictionSessions <= 10) {
      score += 4;
    }

    score = clamp(score);

    let interpretation = `${intent.label} is operating within a stable conversion field.`;

    if (score >= 85) {
      interpretation = `${intent.label} is exerting dominant attraction and should be protected as a premium conversion vector.`;
    } else if (score >= 65) {
      interpretation = `${intent.label} is converting efficiently and should remain visually prominent in the guest journey.`;
    } else if (score >= 40) {
      interpretation = `${intent.label} has meaningful demand but is vulnerable to friction or weak narrative framing.`;
    } else {
      interpretation = `${intent.label} is losing gravitational pull and may be bleeding intent before confirmation.`;
    }

    return {
      id: intent.id,
      label: intent.label,
      score,
      band: scoreToBand(score),
      momentum,
      interpretation,
    };
  }).sort((a, b) => b.score - a.score);
}

export function scoreTherapistStress(
  therapists: BoardroomTherapistView[]
): TherapistStressScore[] {
  return therapists.map((therapist) => {
    const marginValue = parseNumeric(therapist.margin);

    let stressScore = therapist.capacity;

    if (therapist.capacity >= 90) {
      stressScore += 12;
    } else if (therapist.capacity >= 75) {
      stressScore += 6;
    } else if (therapist.capacity <= 50) {
      stressScore -= 10;
    }

    if (marginValue >= 2500) {
      stressScore += 10;
    } else if (marginValue >= 1800) {
      stressScore += 6;
    }

    stressScore = clamp(stressScore);

    let interpretation = `${therapist.name} is operating within healthy deployment parameters.`;

    if (stressScore >= 85) {
      interpretation = `${therapist.name} is under critical deployment pressure and may require immediate load balancing.`;
    } else if (stressScore >= 65) {
      interpretation = `${therapist.name} is highly utilized and should be monitored for overload.`;
    } else if (stressScore <= 35) {
      interpretation = `${therapist.name} has underused capacity and may represent a revenue leak.`;
    }

    return {
      id: therapist.id,
      name: therapist.name,
      margin: therapist.margin,
      capacity: therapist.capacity,
      stressScore,
      band: scoreToBand(stressScore),
      interpretation,
    };
  }).sort((a, b) => b.stressScore - a.stressScore);
}

export function detectConversionAnomalies(
  metrics: BoardroomMetricView[],
  frictionRows: BoardroomFrictionView[],
  intents: BoardroomIntentView[]
): ConversionAnomaly[] {
  const activeSessions = metricNumber(metrics, "active_sessions");
  const vaultConversion = metricNumber(metrics, "vault_conversion");
  const abandonmentLeak = metricNumber(metrics, "abandonment_leak");
  const pipeline = metricNumber(metrics, "pipeline");
  const frictionLoad = frictionRows.reduce((sum, row) => sum + row.sessions, 0);
  const strongestIntent = [...intents].sort((a, b) => b.value - a.value)[0];

  const anomalies: ConversionAnomaly[] = [];

  if (abandonmentLeak >= 12) {
    const score = clamp(abandonmentLeak * 6);
    anomalies.push({
      key: "abandonment_leak",
      title: "Abandonment leak above acceptable threshold",
      severity: scoreToBand(score),
      score,
      interpretation:
        "Active demand exists, but the journey is leaking before confirmation. Review friction points and concierge handoff timing.",
    });
  }

  if (activeSessions >= 20 && vaultConversion < 80) {
    const score = clamp((activeSessions - vaultConversion) * 2.5);
    anomalies.push({
      key: "session_conversion_mismatch",
      title: "Session pressure is not becoming confirmed value fast enough",
      severity: scoreToBand(score),
      score,
      interpretation:
        "Traffic is healthy, but conversion velocity is lagging behind session intensity.",
    });
  }

  if (pipeline >= 10000 && abandonmentLeak >= 10) {
    const score = clamp(60 + abandonmentLeak);
    anomalies.push({
      key: "premium_pipeline_exposure",
      title: "High-value pipeline is exposed to leakage",
      severity: scoreToBand(score),
      score,
      interpretation:
        "A meaningful revenue field is active, but unresolved intent may turn into silent premium loss.",
    });
  }

  if (frictionLoad >= 20) {
    const score = clamp(frictionLoad * 3);
    anomalies.push({
      key: "friction_pressure",
      title: "Aggregate friction pressure is elevated",
      severity: scoreToBand(score),
      score,
      interpretation:
        "Structural resistance is visible across the journey. Reduce schedule mismatch and checkout hesitation first.",
    });
  }

  if (strongestIntent && strongestIntent.value >= 85 && abandonmentLeak >= 10) {
    const score = clamp(70 + strongestIntent.value * 0.2);
    anomalies.push({
      key: "intent_capture_gap",
      title: `${strongestIntent.label} demand is strong but capture quality is underperforming`,
      severity: scoreToBand(score),
      score,
      interpretation:
        "The demand narrative is working, but the operational capture path is not fully monetizing that momentum.",
    });
  }

  return anomalies.sort((a, b) => b.score - a.score);
}

export function buildExecutiveSignals(
  vipRiskScores: VipRiskScore[],
  intentGravityScores: IntentGravityScore[],
  therapistStressScores: TherapistStressScore[],
  conversionAnomalies: ConversionAnomaly[]
): string[] {
  const signals: string[] = [];

  const topVip = vipRiskScores[0];
  const topIntent = intentGravityScores[0];
  const stressedTherapist = therapistStressScores.find((t) => t.band === "critical" || t.band === "high");
  const topAnomaly = conversionAnomalies[0];

  if (topVip) { signals.push(`${topVip.guest} is the most exposed VIP handoff, with ${topVip.score}% abandon risk.`); }
  if (topIntent) { signals.push(`${topIntent.label} is the strongest current intent vector, scoring ${topIntent.score} on gravity.`); }
  if (stressedTherapist) { signals.push(`${stressedTherapist.name} is operating under ${stressedTherapist.band} deployment stress.`); }
  if (topAnomaly) { signals.push(`Primary conversion anomaly: ${topAnomaly.title}.`); }

  return signals;
}

export function createBoardroomIntelligenceSnapshot(
  input: IntelligenceInput
): BoardroomIntelligenceSnapshot {
  const vipRiskScores = scoreVipAbandonRisk(input.vipItems, input.metrics);
  const intentGravityScores = scoreIntentGravity(input.intents, input.frictionRows);
  const therapistStressScores = scoreTherapistStress(input.therapists);
  const conversionAnomalies = detectConversionAnomalies(input.metrics, input.frictionRows, input.intents);

  const executiveSignals = buildExecutiveSignals(vipRiskScores, intentGravityScores, therapistStressScores, conversionAnomalies);

  return { vipRiskScores, intentGravityScores, therapistStressScores, conversionAnomalies, executiveSignals };
}
