import type { SovereignAction } from "@santis/domain-schema/src/core-state.interface";
import {
  DefaultIntentVectors,
  GuestIntentSignalSchema,
  type BiologicalTargetVector,
  type GuestIntentSignal,
  type IntentType,
} from "@santis/domain-schema/src/intent.contract";

export type IntentConflict = {
  code: "RESET_PERFORMANCE_TENSION" | "BEAUTY_RECOVER_TENSION";
  intents: IntentType[];
  detail: string;
  suggestedPrimaryIntent: IntentType;
};

export type ResolvedIntentState = {
  targetVector: BiologicalTargetVector;
  confidenceScore: number;
  primaryIntent: IntentType;
  weightedIntents: Array<{ intent: IntentType; weight: number }>;
  identifiedConflicts: IntentConflict[];
  status: "RESOLVED" | "REJECTED_REQUIRES_CLARIFICATION";
};

const VECTOR_KEYS: Array<keyof BiologicalTargetVector> = [
  "cortisolReductionTarget",
  "muscularRecoveryTarget",
  "cellularTurnoverTarget",
  "energyOptimizationTarget",
  "socialSynchronizationTarget",
];

function normalizeIntentWeights(signal: GuestIntentSignal) {
  const secondary = [...new Set(signal.secondaryIntents.filter(intent => intent !== signal.primaryIntent))];
  const primaryWeight = secondary.length === 0 ? 1 : 0.7;
  const secondaryWeight = secondary.length === 0 ? 0 : 0.3 / secondary.length;

  return [
    { intent: signal.primaryIntent, weight: primaryWeight },
    ...secondary.map(intent => ({ intent, weight: secondaryWeight })),
  ];
}

function blendVectors(weightedIntents: Array<{ intent: IntentType; weight: number }>): BiologicalTargetVector {
  const result = Object.fromEntries(VECTOR_KEYS.map(key => [key, 0])) as BiologicalTargetVector;

  for (const { intent, weight } of weightedIntents) {
    const vector = DefaultIntentVectors[intent].biologicalTargets;
    for (const key of VECTOR_KEYS) {
      result[key] += vector[key] * weight;
    }
  }

  return result;
}

function detectConflicts(signal: GuestIntentSignal): IntentConflict[] {
  const intents = new Set<IntentType>([signal.primaryIntent, ...signal.secondaryIntents]);
  const conflicts: IntentConflict[] = [];

  if (intents.has("RESET") && intents.has("PERFORMANCE")) {
    conflicts.push({
      code: "RESET_PERFORMANCE_TENSION",
      intents: ["RESET", "PERFORMANCE"],
      detail: "RESET prioritizes nervous-system downshift while PERFORMANCE prioritizes energy elevation.",
      suggestedPrimaryIntent: signal.primaryIntent,
    });
  }

  if (intents.has("BEAUTY") && intents.has("RECOVER")) {
    conflicts.push({
      code: "BEAUTY_RECOVER_TENSION",
      intents: ["BEAUTY", "RECOVER"],
      detail: "BEAUTY may require cellular stimulation while RECOVER may require tissue restraint.",
      suggestedPrimaryIntent: signal.primaryIntent,
    });
  }

  return conflicts;
}

function deriveConfidence(baseConfidence: number, conflicts: IntentConflict[]) {
  const penalty = conflicts.length * 0.25;
  return Math.max(0, Math.min(1, baseConfidence - penalty));
}

export const resolveGuestIntent: SovereignAction<unknown, ResolvedIntentState> = async (_ctx, raw) => {
  const parsed = GuestIntentSignalSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid guest intent signal");
  }

  const signal = parsed.data;
  const conflicts = detectConflicts(signal);
  const weightedIntents = normalizeIntentWeights(signal);
  const targetVector = blendVectors(weightedIntents);
  const confidenceScore = deriveConfidence(signal.confidence, conflicts);

  return {
    targetVector,
    confidenceScore,
    primaryIntent: signal.primaryIntent,
    weightedIntents,
    identifiedConflicts: conflicts,
    status: conflicts.length > 0 ? "REJECTED_REQUIRES_CLARIFICATION" : "RESOLVED",
  };
};
