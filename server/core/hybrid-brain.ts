export type HybridVerdict =
  | "OCCUPANCY_ALIGNED"
  | "DESIRE_DRIVEN"
  | "CONFLICTED";

export interface HybridBrainInput {
  occupancyPercent: number;
  genomeScore?: number | null;
}

export interface HybridBrainAnalysis {
  occupancyMultiplier: number;
  genomeMultiplier: number;
  hybridMultiplier: number;
  divergence: number;
  verdict: HybridVerdict;
  genomeScore: number;
}

const W_OCC = 0.7;
const W_GEN = 0.3;

const round = (value: number) => Number(value.toFixed(3));

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const clampScore = (value: number) => Math.max(0, Math.min(1, value));

function calculateOccupancyBaseMultiplier(occupancyPercent: number): number {
  if (occupancyPercent >= 92) return 1.15;
  if (occupancyPercent >= 82) return 1.1;
  if (occupancyPercent >= 70) return 1.07;
  if (occupancyPercent >= 58) return 1.04;
  return 1;
}

function calculateGenomeMultiplier(genomeScore: number): number {
  if (genomeScore >= 0.95) return 1.09;
  if (genomeScore >= 0.9) return 1.07;
  if (genomeScore >= 0.85) return 1.05;
  if (genomeScore >= 0.75) return 1.03;
  if (genomeScore >= 0.65) return 1.01;
  return 1;
}

function deriveVerdict(divergence: number): HybridVerdict {
  if (divergence >= 0.01) {
    return "DESIRE_DRIVEN";
  }

  if (divergence <= -0.01) {
    return "CONFLICTED";
  }

  return "OCCUPANCY_ALIGNED";
}

export const HybridBrain = {
  W_OCC,
  W_GEN,

  analyze(input: HybridBrainInput): HybridBrainAnalysis {
    const occupancyPercent = clampPercent(input.occupancyPercent);
    const genomeScore = clampScore(input.genomeScore ?? 0);
    const occupancyMultiplier = calculateOccupancyBaseMultiplier(occupancyPercent);
    const genomeMultiplier = calculateGenomeMultiplier(genomeScore);
    const hybridMultiplier = round(
      occupancyMultiplier * W_OCC + genomeMultiplier * W_GEN
    );
    const divergence = round(hybridMultiplier - occupancyMultiplier);

    return {
      occupancyMultiplier,
      genomeMultiplier,
      hybridMultiplier,
      divergence,
      verdict: deriveVerdict(divergence),
      genomeScore,
    };
  },

  shouldCreateDesireSurgeCandidate(
    input: HybridBrainInput,
    analysis?: HybridBrainAnalysis
  ): boolean {
    const resolvedAnalysis = analysis ?? this.analyze(input);
    return (
      input.occupancyPercent >= 55 &&
      input.occupancyPercent < 80 &&
      resolvedAnalysis.genomeScore >= 0.85 &&
      resolvedAnalysis.verdict === "DESIRE_DRIVEN"
    );
  },
};
