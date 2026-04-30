import { oracleStrategySimulationStore } from "./oracle-strategy-simulation.store.js";
import type { OracleActionMemoryRecord } from "./oracle-action-memory.contract.js";
import type { OracleStrategyScenario } from "./oracle-strategy-simulation.contract.js";
import type {
  OracleExecutionGuardrail,
  OracleExecutionPlan,
  OracleExecutionStep,
} from "./oracle-execution-guard.contract.js";

export class OracleExecutionGuardStore {
  evaluate(records: OracleActionMemoryRecord[]): OracleExecutionPlan {
    const simulation = oracleStrategySimulationStore.simulate(records);
    const scenario = this.resolveRecommendedScenario(simulation.scenarios, simulation.recommendedScenarioId);
    const generatedAt = new Date().toISOString();

    if (!scenario) {
      return {
        planId: `oracle-execution-plan-${Date.parse(generatedAt)}`,
        generatedAt,
        source: "strategy-simulation",
        status: "awaiting_signal",
        executable: false,
        scenarioId: null,
        targetNodeId: null,
        rationale: "No strategy scenario is strong enough for guarded execution planning yet.",
        guardrails: [],
        steps: [],
      };
    }

    const guardrails = this.buildGuardrails(scenario);
    const executable = guardrails.every((guardrail) => guardrail.passed || guardrail.severity !== "blocking");

    return {
      planId: `oracle-execution-plan-${Date.parse(generatedAt)}`,
      generatedAt,
      source: "strategy-simulation",
      status: executable ? "human_approval_required" : "not_recommended",
      executable,
      scenarioId: scenario.scenarioId,
      targetNodeId: scenario.targetNodeId,
      rationale: this.buildRationale(scenario, executable),
      guardrails,
      steps: executable ? this.buildSteps(scenario) : [],
    };
  }

  resolveRecommendedScenario(
    scenarios: OracleStrategyScenario[],
    recommendedScenarioId: string | null,
  ): OracleStrategyScenario | null {
    return scenarios.find((scenario) => scenario.scenarioId === recommendedScenarioId)
      || [...scenarios].sort((a, b) => b.riskAdjustedConfidence - a.riskAdjustedConfidence)[0]
      || null;
  }

  buildGuardrails(scenario: OracleStrategyScenario): OracleExecutionGuardrail[] {
    const vipThresholdPassed = this.hasVipIntentSignal(scenario);

    return [
      {
        key: "confidence",
        label: "Risk-adjusted confidence",
        passed: scenario.riskAdjustedConfidence >= 85,
        actual: scenario.riskAdjustedConfidence,
        threshold: 85,
        severity: "blocking",
      },
      {
        key: "risk",
        label: "Risk boundary",
        passed: scenario.riskLevel === "low" || scenario.riskLevel === "medium",
        actual: scenario.riskLevel,
        threshold: "low_or_medium",
        severity: "blocking",
      },
      {
        key: "revenue",
        label: "Forecast direction",
        passed: scenario.projectedRevenueLift > 0,
        actual: scenario.projectedRevenueLift,
        threshold: "> 0",
        severity: "blocking",
      },
      {
        key: "vip_threshold",
        label: "VIP or high-intent threshold",
        passed: vipThresholdPassed,
        actual: vipThresholdPassed,
        threshold: true,
        severity: "blocking",
      },
    ];
  }

  buildSteps(scenario: OracleStrategyScenario): OracleExecutionStep[] {
    return [
      {
        stepId: "sovereign-concierge-follow-up",
        label: "Start Sovereign Concierge follow-up",
        detail: `Route ${scenario.targetNodeId} high-intent leads to human Concierge review before outreach.`,
        status: "proposed",
      },
      {
        stepId: "promote-high-value-ritual",
        label: "Promote high-value ritual card",
        detail: "Prioritize the strongest Sovereign or VIP ritual in the next Boardroom-approved content window.",
        status: "proposed",
      },
      {
        stepId: "reduce-low-value-upsell",
        label: "Reduce low-value upsell exposure",
        detail: "De-emphasize low-value upsell prompts while the high-confidence strategy window is active.",
        status: "proposed",
      },
    ];
  }

  buildRationale(scenario: OracleStrategyScenario, executable: boolean): string {
    if (!executable) {
      return `Scenario ${scenario.label} is not ready for execution planning. Guardrails require confidence >= 85, low/medium risk, positive forecast, and VIP or high-intent signal.`;
    }

    return `Scenario ${scenario.label} passed guarded planning with ${scenario.riskAdjustedConfidence}% confidence and ${scenario.projectedRevenueLift}% projected revenue lift. Human approval is required before any operational action.`;
  }

  hasVipIntentSignal(scenario: OracleStrategyScenario): boolean {
    const signalText = `${scenario.strategy} ${scenario.decisionPath.join(" ")}`.toLowerCase();
    return scenario.projectedApprovalRate >= 70
      || signalText.includes("vip")
      || signalText.includes("sovereign")
      || signalText.includes("concierge")
      || signalText.includes("high-intent");
  }
}

export const oracleExecutionGuardStore = new OracleExecutionGuardStore();
