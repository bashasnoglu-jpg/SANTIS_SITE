import { appendFile, mkdir } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import * as readline from "readline";
import * as path from "path";
import crypto from "crypto";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "strategy-learning-memory.jsonl");

export type StrategyLearningEventType = "operator_decision" | "execution_outcome";
export type StrategyLearningDecision = "approve" | "reject";

export interface StrategyLearningRecord {
  recordId: string;
  type: StrategyLearningEventType;
  strategyId: string;
  variantId: string;
  strategyKey: string;
  segment: string;
  score: number;
  decision?: StrategyLearningDecision;
  forecastRevenueLift?: number;
  actualRevenueLift?: number;
  forecastConfidence?: number;
  actualConfidence?: number;
  recordedAt: string;
}

export interface StrategyLearningSnapshot {
  key: string;
  strategyKey: string;
  variantId: string;
  segment: string;
  sampleSize: number;
  appliedCount: number;
  rejectedCount: number;
  outcomeCount: number;
  averageScore: number;
  decayedScore: number;
  successRate: number;
  smoothedSuccessRate: number;
  confidenceBias: number;
  rankingMultiplier: number;
  lastUpdatedAt: string | null;
}

export interface StrategyVariantLearningInput {
  strategyKey: string;
  variantId: string;
  segment: string;
  confidence: number;
  successRate: number;
}

export interface StrategyVariantLearningBias {
  snapshot: StrategyLearningSnapshot | null;
  confidence: number;
  successRate: number;
  rankingMultiplier: number;
  sampleTrusted: boolean;
  trustWeight: number;
  reasoning: string[];
}

const MIN_TRUSTED_SAMPLE_SIZE = 3;
const HALF_LIFE_DAYS = 21;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

function ageWeight(recordedAt: string, nowMs: number) {
  const ageMs = Math.max(0, nowMs - Date.parse(recordedAt));
  const ageDays = ageMs / 86400000;
  return 0.5 ** (ageDays / HALF_LIFE_DAYS);
}

function sampleTrustWeight(sampleSize: number) {
  if (sampleSize <= 0) return 0;
  return clamp(sampleSize / (sampleSize + MIN_TRUSTED_SAMPLE_SIZE), 0, 1);
}

function buildAggregateKey(segment: string, strategyKey: string, variantId: string) {
  return `${segment}|${strategyKey}|${variantId}`;
}

export function buildPriceAdjustmentStrategyKey(deltaPct: number) {
  return `price_adjustment:${deltaPct.toFixed(4)}`;
}

export function inferStrategyKeyFromVariantId(variantId: string) {
  const knownPricingVariants: Record<string, number> = {
    s1: 0.05,
    s2: 0.1,
    s3: -0.05,
  };

  return knownPricingVariants[variantId] !== undefined
    ? buildPriceAdjustmentStrategyKey(knownPricingVariants[variantId])
    : variantId;
}

export class StrategyLearningStore {
  async append(record: Omit<StrategyLearningRecord, "recordId" | "recordedAt">): Promise<StrategyLearningRecord> {
    if (!existsSync(STORE_DIR)) {
      await mkdir(STORE_DIR, { recursive: true });
    }

    const fullRecord: StrategyLearningRecord = {
      ...record,
      score: clamp(record.score, -1, 1),
      recordId: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
    };

    await appendFile(STORE_FILE, `${JSON.stringify(fullRecord)}\n`, "utf-8");
    return fullRecord;
  }

  async recordOperatorDecision(input: {
    strategyId: string;
    variantId: string;
    strategyKey: string;
    segment: string;
    decision: StrategyLearningDecision;
  }): Promise<StrategyLearningRecord> {
    return this.append({
      type: "operator_decision",
      strategyId: input.strategyId,
      variantId: input.variantId,
      strategyKey: input.strategyKey,
      segment: input.segment,
      decision: input.decision,
      score: input.decision === "approve" ? 0.25 : -0.35,
    });
  }

  async recordExecutionOutcome(input: {
    strategyId: string;
    variantId: string;
    strategyKey?: string;
    segment?: string;
    executionStatus: "implemented" | "partially_implemented" | "not_implemented";
    forecastRevenueLift: number;
    actualRevenueLift: number;
    forecastConfidence: number;
    actualConfidence: number;
  }): Promise<StrategyLearningRecord> {
    const revenueScore = clamp(input.actualRevenueLift / 20, -1, 1);
    const confidenceScore = clamp((input.actualConfidence - input.forecastConfidence) / 25, -1, 1);
    const revenueDeltaScore = clamp((input.actualRevenueLift - input.forecastRevenueLift) / 20, -1, 1);
    const implementationPenalty =
      input.executionStatus === "not_implemented"
        ? -0.35
        : input.executionStatus === "partially_implemented"
          ? -0.1
          : 0;

    return this.append({
      type: "execution_outcome",
      strategyId: input.strategyId,
      variantId: input.variantId,
      strategyKey: input.strategyKey || input.variantId,
      segment: input.segment || "default",
      score: clamp((revenueScore * 0.5) + (revenueDeltaScore * 0.25) + (confidenceScore * 0.25) + implementationPenalty, -1, 1),
      forecastRevenueLift: input.forecastRevenueLift,
      actualRevenueLift: input.actualRevenueLift,
      forecastConfidence: input.forecastConfidence,
      actualConfidence: input.actualConfidence,
    });
  }

  async replay(limit: number = 500): Promise<StrategyLearningRecord[]> {
    if (!existsSync(STORE_FILE)) {
      return [];
    }

    const records: StrategyLearningRecord[] = [];
    const fileStream = createReadStream(STORE_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line) as StrategyLearningRecord;
        if (parsed.strategyId && parsed.variantId && parsed.strategyKey && parsed.segment) {
          records.push(parsed);
        }
      } catch (error) {
        console.warn("[Strategy Learning] Skipping invalid memory record.", error);
      }
    }

    return records
      .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))
      .slice(0, limit);
  }

  async summarize(limit: number = 500): Promise<StrategyLearningSnapshot[]> {
    const records = await this.replay(limit);
    const buckets = new Map<string, StrategyLearningRecord[]>();

    for (const record of records) {
      const key = buildAggregateKey(record.segment, record.strategyKey, record.variantId);
      buckets.set(key, [...(buckets.get(key) || []), record]);
    }

    return [...buckets.entries()]
      .map(([key, bucket]) => this.toSnapshot(key, bucket))
      .sort((a, b) => b.sampleSize - a.sampleSize || b.averageScore - a.averageScore);
  }

  async getSnapshot(input: {
    strategyKey: string;
    variantId: string;
    segment: string;
  }): Promise<StrategyLearningSnapshot | null> {
    const records = await this.replay();
    const exact = records.filter((record) =>
      record.strategyKey === input.strategyKey &&
      record.variantId === input.variantId &&
      record.segment === input.segment
    );

    if (exact.length > 0) {
      return this.toSnapshot(buildAggregateKey(input.segment, input.strategyKey, input.variantId), exact);
    }

    const fallback = records.filter((record) =>
      record.strategyKey === input.strategyKey &&
      record.variantId === input.variantId &&
      record.segment === "default"
    );

    if (fallback.length > 0) {
      return this.toSnapshot(buildAggregateKey("default", input.strategyKey, input.variantId), fallback);
    }

    const strategySegmentFallback = records.filter((record) =>
      record.strategyKey === input.strategyKey &&
      record.segment === input.segment
    );

    if (strategySegmentFallback.length > 0) {
      return this.toSnapshot(buildAggregateKey(input.segment, input.strategyKey, "all"), strategySegmentFallback);
    }

    const strategyDefaultFallback = records.filter((record) =>
      record.strategyKey === input.strategyKey &&
      record.segment === "default"
    );

    if (strategyDefaultFallback.length > 0) {
      return this.toSnapshot(buildAggregateKey("default", input.strategyKey, "all"), strategyDefaultFallback);
    }

    return null;
  }

  async applyVariantBias(input: StrategyVariantLearningInput): Promise<StrategyVariantLearningBias> {
    const snapshot = await this.getSnapshot(input);

    if (!snapshot) {
      return {
        snapshot: null,
        confidence: input.confidence,
        successRate: input.successRate,
        rankingMultiplier: 1,
        sampleTrusted: false,
        trustWeight: 0,
        reasoning: ["learning=none"],
      };
    }

    const sampleTrusted = snapshot.sampleSize >= MIN_TRUSTED_SAMPLE_SIZE;
    const trustWeight = sampleTrustWeight(snapshot.sampleSize);
    const confidenceBias = snapshot.confidenceBias * trustWeight;
    const learnedSuccessRate = clamp(snapshot.successRate * trustWeight, 0, 1);
    const successRateWeight = 0.35 * trustWeight;
    const rankingMultiplier = 1 + ((snapshot.rankingMultiplier - 1) * trustWeight);
    const confidence = clamp(input.confidence + confidenceBias, 0, 1);
    const successRate = clamp((input.successRate * (1 - successRateWeight)) + (learnedSuccessRate * successRateWeight), 0, 1);

    return {
      snapshot,
      confidence,
      successRate,
      rankingMultiplier,
      sampleTrusted,
      trustWeight,
      reasoning: [
        `learningSamples=${snapshot.sampleSize}`,
        `learningTrusted=${sampleTrusted}`,
        `trustWeight=${trustWeight.toFixed(4)}`,
        `learningScore=${snapshot.decayedScore.toFixed(4)}`,
        `smoothedSuccessRate=${snapshot.smoothedSuccessRate.toFixed(4)}`,
        `learnedSuccessRate=${learnedSuccessRate.toFixed(4)}`,
        `confidenceBias=${confidenceBias.toFixed(4)}`,
      ],
    };
  }

  toSnapshot(key: string, records: StrategyLearningRecord[]): StrategyLearningSnapshot {
    const nowMs = Date.now();
    const scoreTotal = records.reduce((sum, record) => sum + record.score, 0);
    const weighted = records.reduce(
      (acc, record) => {
        const weight = ageWeight(record.recordedAt, nowMs);
        return {
          score: acc.score + (record.score * weight),
          weight: acc.weight + weight,
        };
      },
      { score: 0, weight: 0 },
    );
    const averageScore = scoreTotal / records.length;
    const decayedScore = weighted.weight > 0 ? weighted.score / weighted.weight : averageScore;
    const appliedCount = records.filter((record) => record.decision === "approve").length;
    const rejectedCount = records.filter((record) => record.decision === "reject").length;
    const outcomes = records.filter((record) => record.type === "execution_outcome");
    const outcomeCount = outcomes.length;
    const positiveOutcomeCount = outcomes.filter((record) => record.score > 0).length;
    const smoothedSuccessRate = (positiveOutcomeCount + 1) / (outcomeCount + 2);
    const scoreSuccessRate = clamp((decayedScore + 1) / 2, 0, 1);
    const successRate = outcomeCount > 0
      ? (smoothedSuccessRate * 0.65) + (scoreSuccessRate * 0.35)
      : scoreSuccessRate;
    const approvalBias = records.length > 0 ? (appliedCount - rejectedCount) / records.length : 0;

    const latest = records
      .map((record) => record.recordedAt)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;

    return {
      key,
      strategyKey: records[0].strategyKey,
      variantId: records[0].variantId,
      segment: records[0].segment,
      sampleSize: records.length,
      appliedCount,
      rejectedCount,
      outcomeCount,
      averageScore: round4(averageScore),
      decayedScore: round4(decayedScore),
      successRate: round4(successRate),
      smoothedSuccessRate: round4(smoothedSuccessRate),
      confidenceBias: round4(clamp((decayedScore * 0.12) + (approvalBias * 0.05), -0.15, 0.15)),
      rankingMultiplier: round4(1 + clamp((decayedScore * 0.2) + (approvalBias * 0.08), -0.25, 0.25)),
      lastUpdatedAt: latest,
    };
  }
}

export const strategyLearningStore = new StrategyLearningStore();
