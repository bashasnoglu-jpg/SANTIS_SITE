import { TechnicalDebtSignalSchema, TechnicalDebtSnapshot } from "./technical-debt.contract";
import { persistTechnicalDebtSignal, readTechnicalDebtSignals } from "./technical-debt.repository";

const inMemorySignals: any[] = [];

export async function ingestTechnicalDebtSignal(raw: unknown) {
  const parsed = TechnicalDebtSignalSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Invalid technical debt signal payload");
  }

  const signal = parsed.data;

  // Always keep in-memory for local/dev continuity
  inMemorySignals.push(signal);

  // Attempt persistence (non-blocking philosophy)
  try {
    await persistTechnicalDebtSignal(signal);
  } catch (err) {
    console.warn("[MEMORY] Persistence failed, falling back to in-memory only.");
  }

  return signal;
}

export async function getTechnicalDebtSnapshot(): Promise<TechnicalDebtSnapshot> {
  // Prefer DB if available
  let signals = await readTechnicalDebtSignals();

  if (!signals) {
    signals = [...inMemorySignals];
  }

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
