import { TechnicalDebtSignalSchema, TechnicalDebtSnapshot } from "./technical-debt.contract";

const inMemorySignals: any[] = [];

export function ingestTechnicalDebtSignal(raw: unknown) {
  const parsed = TechnicalDebtSignalSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Invalid technical debt signal payload");
  }

  inMemorySignals.push(parsed.data);

  return parsed.data;
}

export function getTechnicalDebtSnapshot(): TechnicalDebtSnapshot {
  const signals = [...inMemorySignals];

  const critical = signals.filter(s => s.severity === "critical").length;
  const high = signals.filter(s => s.severity === "high").length;
  const euroRiskTotal = signals.reduce((acc, s) => acc + s.euroRisk, 0);

  let posture: TechnicalDebtSnapshot["posture"] = "sealed";

  if (critical > 0) posture = "breach";
  else if (high > 2) posture = "degraded";
  else if (signals.length > 0) posture = "watch";

  return {
    generatedAt: new Date().toISOString(),
    totalSignals: signals.length,
    criticalSignals: critical,
    highSignals: high,
    euroRiskTotal,
    posture,
    signals,
  };
}
