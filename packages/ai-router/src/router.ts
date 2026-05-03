import { AIRouterRequest, AIRouterDecision } from './types';
import { roughTokenEstimate, estimateCostEUR } from './pricing';
import { checkCostGuard, registerCost } from './cost-guard';

export function decideModel(req: AIRouterRequest): AIRouterDecision {
  const estimatedInput = req.estimatedInputTokens ?? roughTokenEstimate(req.prompt);

  let model: 'gpt-4.1-mini' | 'gpt-4.1' = 'gpt-4.1-mini';
  let reason = 'default cheap path';
  let requiresManualApproval = false;

  switch (req.task) {
    case 'ci_review':
    case 'small_code_change':
      model = 'gpt-4.1-mini';
      reason = 'cheap deterministic task';
      break;

    case 'large_refactor':
    case 'architecture_review':
      model = 'gpt-4.1';
      reason = 'complex reasoning required';
      break;

    case 'critical_runtime_decision':
      model = 'gpt-4.1';
      requiresManualApproval = true;
      reason = 'critical decision requires human validation';
      break;

    default:
      model = 'gpt-4.1-mini';
  }

  const estimatedCost = estimateCostEUR({
    model,
    inputTokens: estimatedInput,
    outputTokens: req.maxOutputTokens
  });

  const costGuard = checkCostGuard(
    {
      maxRequestCostEur: 0.5,
      maxMonthlyBudgetEur: 20
    },
    estimatedCost
  );

  return {
    model,
    reason,
    allowed: costGuard.allowed,
    requiresManualApproval,
    estimatedInputTokens: estimatedInput,
    maxOutputTokens: req.maxOutputTokens,
    estimatedCostEur: estimatedCost,
    metadata: {
      costGuardReason: costGuard.allowed ? null : costGuard.reason
    }
  };
}

export function finalizeCost(cost: number) {
  registerCost(cost);
}
