import type { TechnicalDebtSignal } from "./technical-debt.contract";
import { readTechnicalDebtSignals } from "./technical-debt.repository";

export type TechnicalDebtTrendPoint = {
  date: string;
  signalCount: number;
  criticalSignals: number;
  highSignals: number;
  euroRiskAdded: number;
  cumulativeEuroRisk: number;
};

export type TechnicalDebtTrendProjection = {
  generatedAt: string;
  windowDays: number;
  thresholdEuro: number;
  currentEuroDebt: number;
  debtVelocityEuroPerDay: number;
  trendDirection: "STABLE" | "DEGRADING" | "IMPROVING";
  estimatedBreachDate: string | null;
  slope: "flat" | "rising" | "accelerating";
  totalSignals: number;
  points: TechnicalDebtTrendPoint[];
};

const DEFAULT_THRESHOLD_EURO = 5000;

function createWindowKeys(windowDays: number) {
  const keys: string[] = [];
  const now = new Date();

  for (let i = windowDays - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - i);
    keys.push(date.toISOString().slice(0, 10));
  }

  return keys;
}

function deriveSlope(points: TechnicalDebtTrendPoint[]) {
  if (points.length < 3) return "flat" as const;

  const midpoint = Math.floor(points.length / 2);
  const firstHalf = points.slice(0, midpoint).reduce((sum, point) => sum + point.euroRiskAdded, 0);
  const secondHalf = points.slice(midpoint).reduce((sum, point) => sum + point.euroRiskAdded, 0);

  if (secondHalf === 0) return "flat" as const;
  if (firstHalf === 0 && secondHalf > 0) return "accelerating" as const;
  if (secondHalf > firstHalf * 1.5) return "accelerating" as const;
  if (secondHalf > firstHalf) return "rising" as const;
  return "flat" as const;
}

function calculateLinearVelocity(points: TechnicalDebtTrendPoint[]) {
  if (points.length < 2) return 0;

  const xs = points.map((_, index) => index);
  const ys = points.map(point => point.cumulativeEuroRisk);
  const n = points.length;
  const sumX = xs.reduce((sum, value) => sum + value, 0);
  const sumY = ys.reduce((sum, value) => sum + value, 0);
  const sumXY = xs.reduce((sum, value, index) => sum + value * ys[index], 0);
  const sumXX = xs.reduce((sum, value) => sum + value * value, 0);
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}

function estimateBreachDate(currentDebt: number, velocityPerDay: number, thresholdEuro: number) {
  if (currentDebt >= thresholdEuro) return new Date().toISOString();
  if (velocityPerDay <= 0) return null;

  const daysUntilBreach = Math.ceil((thresholdEuro - currentDebt) / velocityPerDay);
  const breach = new Date();
  breach.setUTCDate(breach.getUTCDate() + daysUntilBreach);
  return breach.toISOString();
}

export async function getTechnicalDebtTrendProjection(options: { windowDays?: number; thresholdEuro?: number } = {}): Promise<TechnicalDebtTrendProjection> {
  const windowDays = Math.max(1, Math.min(options.windowDays ?? 30, 180));
  const thresholdEuro = Math.max(1, options.thresholdEuro ?? DEFAULT_THRESHOLD_EURO);
  const signals = (await readTechnicalDebtSignals(1000)) ?? [];
  const keys = createWindowKeys(windowDays);
  const buckets = new Map<string, TechnicalDebtTrendPoint>();

  for (const key of keys) {
    buckets.set(key, {
      date: key,
      signalCount: 0,
      criticalSignals: 0,
      highSignals: 0,
      euroRiskAdded: 0,
      cumulativeEuroRisk: 0,
    });
  }

  const oldestKey = keys[0];
  let priorRisk = 0;

  for (const signal of signals as TechnicalDebtSignal[]) {
    const key = signal.detectedAt.slice(0, 10);

    if (key < oldestKey) {
      priorRisk += signal.euroRisk;
      continue;
    }

    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.signalCount += 1;
    bucket.euroRiskAdded += signal.euroRisk;
    if (signal.severity === "critical") bucket.criticalSignals += 1;
    if (signal.severity === "high") bucket.highSignals += 1;
  }

  let cumulative = priorRisk;
  const points = keys.map((key) => {
    const point = buckets.get(key)!;
    cumulative += point.euroRiskAdded;
    return { ...point, cumulativeEuroRisk: cumulative };
  });

  const debtVelocityEuroPerDay = calculateLinearVelocity(points);
  const currentEuroDebt = points.at(-1)?.cumulativeEuroRisk ?? 0;
  const trendDirection = debtVelocityEuroPerDay > 0
    ? "DEGRADING"
    : debtVelocityEuroPerDay < 0
      ? "IMPROVING"
      : "STABLE";

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    thresholdEuro,
    currentEuroDebt,
    debtVelocityEuroPerDay,
    trendDirection,
    estimatedBreachDate: estimateBreachDate(currentEuroDebt, debtVelocityEuroPerDay, thresholdEuro),
    slope: deriveSlope(points),
    totalSignals: signals.length,
    points,
  };
}
