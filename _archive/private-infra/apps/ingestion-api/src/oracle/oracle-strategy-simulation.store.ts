import { oracleCrossNodeLearningStore } from "./oracle-cross-node-learning.store.js";
import type { OracleActionMemoryRecord } from "./oracle-action-memory.contract.js";
import type { OracleLearningTransfer } from "./oracle-cross-node-learning.contract.js";
import type {
  OracleStrategyScenario,
  OracleStrategySimulation,
} from "./oracle-strategy-simulation.contract.js";

export class OracleStrategySimulationStore {
  simulate(records: OracleActionMemoryRecord[]): OracleStrategySimulation {
    const learning = oracleCrossNodeLearningStore.evaluate(records);
    const bestTransfer = this.resolveBestTransfer(learning.transfers);
    const generatedAt = new Date().toISOString();
    const scenarios = bestTransfer ? this.buildScenarios(bestTransfer) : [];
    const recommendedScenario = this.resolveRecommendedScenario(scenarios);

    return {
      simulationId: `oracle-simulation-${Date.parse(generatedAt)}`,
      generatedAt,
      source: "cross-node-learning",
      scenarioCount: scenarios.length,
      recommendedScenarioId: recommendedScenario?.scenarioId || null,
      executivePreview: this.buildExecutivePreview(bestTransfer, recommendedScenario),
      scenarios,
    };
  }

  buildScenarios(transfer: OracleLearningTransfer): OracleStrategyScenario[] {
    return [
      this.createScenario({
        mode: "conservative",
        label: "Scenario A - Conservative transfer",
        transfer,
        confidenceMultiplier: 0.86,
        revenueMultiplier: 0.7,
        path: [
          "Keep HACI approval as execution gate",
          "Run one target-node validation window",
          "Apply learning only to matching high-intent signals",
        ],
      }),
      this.createScenario({
        mode: "accelerated",
        label: "Scenario B - Accelerated rollout",
        transfer,
        confidenceMultiplier: 1,
        revenueMultiplier: 1.15,
        path: [
          "Surface the strategy in Executive Mode",
          "Prioritize qualified VIP and Sovereign signals",
          "Review escalations before any operational activation",
        ],
      }),
    ];
  }

  createScenario({
    mode,
    label,
    transfer,
    confidenceMultiplier,
    revenueMultiplier,
    path,
  }: {
    mode: "conservative" | "accelerated";
    label: string;
    transfer: OracleLearningTransfer;
    confidenceMultiplier: number;
    revenueMultiplier: number;
    path: string[];
  }): OracleStrategyScenario {
    const riskLevel = this.resolveRiskLevel(transfer, mode);
    const riskPenalty = riskLevel === "high" ? 18 : riskLevel === "medium" ? 9 : 3;
    const riskAdjustedConfidence = this.clamp(
      Math.round(transfer.adjustedConfidence * confidenceMultiplier - riskPenalty),
      0,
      100,
    );
    const projectedApprovalRate = this.clamp(
      Math.round((transfer.baseConfidence + riskAdjustedConfidence) / 2),
      0,
      100,
    );

    return {
      scenarioId: `${transfer.transferId}-${mode}`,
      label,
      strategy: transfer.recommendation,
      targetNodeId: transfer.targetNodeId,
      projectedRevenueLift: this.resolveRevenueLift(riskAdjustedConfidence, revenueMultiplier),
      projectedApprovalRate,
      riskAdjustedConfidence,
      riskLevel,
      decisionPath: path,
    };
  }

  resolveBestTransfer(transfers: OracleLearningTransfer[]): OracleLearningTransfer | null {
    return [...transfers]
      .sort((a, b) => b.adjustedConfidence - a.adjustedConfidence || b.contextFit - a.contextFit)[0] || null;
  }

  resolveRecommendedScenario(scenarios: OracleStrategyScenario[]): OracleStrategyScenario | null {
    return [...scenarios]
      .filter((scenario) => scenario.riskLevel !== "high")
      .sort((a, b) => b.riskAdjustedConfidence - a.riskAdjustedConfidence)[0] || null;
  }

  resolveRiskLevel(transfer: OracleLearningTransfer, mode: "conservative" | "accelerated"): "low" | "medium" | "high" {
    if (transfer.riskBoundary === "high") return "high";
    if (mode === "accelerated" && transfer.riskBoundary === "medium") return "high";
    if (mode === "accelerated") return "medium";
    return transfer.riskBoundary;
  }

  resolveRevenueLift(riskAdjustedConfidence: number, multiplier: number): number {
    return Math.round((riskAdjustedConfidence / 100) * 18 * multiplier);
  }

  buildExecutivePreview(
    transfer: OracleLearningTransfer | null,
    recommendedScenario: OracleStrategyScenario | null,
  ): string {
    if (!transfer || !recommendedScenario) {
      return "No strategy simulation is ready yet. Cross-node learning needs a transferable pattern before scenario projection.";
    }

    return `${recommendedScenario.label} is the recommended preview for ${transfer.targetNodeId}: ${recommendedScenario.projectedRevenueLift}% projected revenue lift at ${recommendedScenario.riskAdjustedConfidence}% risk-adjusted confidence. Human approval remains required before action.`;
  }

  clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}

export const oracleStrategySimulationStore = new OracleStrategySimulationStore();
