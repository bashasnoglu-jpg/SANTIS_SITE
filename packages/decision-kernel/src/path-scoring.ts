import type { BiologicalTargetVector } from "@santis/domain-schema/src/intent.contract";
import type { RitualNode, RitualEdge } from "./ritual-graph.contract";

export type PathStep = {
  node: RitualNode;
  viaEdge?: RitualEdge;
  restMinutesBefore: number;
};

export type PathScore = {
  alignmentScore: number; // 0..1 closeness to target
  synergyScore: number;   // multiplicative effect from edges
  loadPenalty: number;    // penalties from sequential load/rest violations
  totalScore: number;     // final objective for A*
  totalCost: number;
  totalDuration: number;
};

const VECTOR_KEYS: Array<keyof BiologicalTargetVector> = [
  "cortisolReductionTarget",
  "muscularRecoveryTarget",
  "cellularTurnoverTarget",
  "energyOptimizationTarget",
  "socialSynchronizationTarget",
];

export function accumulateVector(path: PathStep[]): BiologicalTargetVector {
  const acc = Object.fromEntries(VECTOR_KEYS.map(k => [k, 0])) as BiologicalTargetVector;
  for (const step of path) {
    const v = step.node.vectorDelta;
    for (const k of VECTOR_KEYS) acc[k] += v[k];
  }
  return acc;
}

export function computeAlignmentScore(current: BiologicalTargetVector, target: BiologicalTargetVector): number {
  // cosine-like normalized dot product (bounded 0..1 for non-negative vectors)
  let dot = 0, normC = 0, normT = 0;
  for (const k of VECTOR_KEYS) {
    dot += current[k] * target[k];
    normC += current[k] * current[k];
    normT += target[k] * target[k];
  }
  if (normC === 0 || normT === 0) return 0;
  const cos = dot / (Math.sqrt(normC) * Math.sqrt(normT));
  return Math.max(0, Math.min(1, cos));
}

export function computeSynergyScore(path: PathStep[]): number {
  // product of edge multipliers (bounded to avoid runaway growth)
  let score = 1;
  for (const step of path) {
    if (step.viaEdge) score *= step.viaEdge.synergyMultiplier;
  }
  // clamp
  return Math.max(0.5, Math.min(2.0, score));
}

export function computeLoadPenalty(path: PathStep[]): number {
  let penalty = 0;
  let rollingLoad = 0;
  for (const step of path) {
    const nodeLoad = step.node.loadScore;
    rollingLoad += nodeLoad;
    if (step.viaEdge) {
      const { maxSequentialLoad, minRestMinutes } = step.viaEdge.constraints;
      if (rollingLoad > maxSequentialLoad) penalty += (rollingLoad - maxSequentialLoad);
      if (step.restMinutesBefore < minRestMinutes) penalty += (minRestMinutes - step.restMinutesBefore) / 60; // hour-normalized
    }
    // decay after rest
    if (step.restMinutesBefore > 0) {
      const decay = Math.min(1, step.restMinutesBefore / 30);
      rollingLoad *= (1 - decay);
    }
  }
  return penalty; // higher is worse
}

export function computeCost(path: PathStep[]): number {
  return path.reduce((acc, s) => acc + s.node.baseCost, 0);
}

export function computeDuration(path: PathStep[]): number {
  return path.reduce((acc, s) => acc + s.node.durationMinutes + s.restMinutesBefore, 0);
}

export function scorePath(path: PathStep[], target: BiologicalTargetVector): PathScore {
  const current = accumulateVector(path);
  const alignmentScore = computeAlignmentScore(current, target);
  const synergyScore = computeSynergyScore(path);
  const loadPenalty = computeLoadPenalty(path);
  const totalCost = computeCost(path);
  const totalDuration = computeDuration(path);

  // objective: maximize alignment & synergy, minimize penalty & time/cost (soft)
  const totalScore = (alignmentScore * 0.6 + synergyScore * 0.4) - loadPenalty * 0.5 - (totalDuration / 300) * 0.1 - (totalCost / 500) * 0.1;

  return { alignmentScore, synergyScore, loadPenalty, totalScore, totalCost, totalDuration };
}
