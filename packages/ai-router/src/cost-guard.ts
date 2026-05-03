export interface CostGuardConfig {
  maxRequestCostEur: number;
  maxMonthlyBudgetEur: number;
}

let monthlySpent = 0;

export function resetMonthlyBudget() {
  monthlySpent = 0;
}

export function registerCost(cost: number) {
  monthlySpent += cost;
}

export function getMonthlySpent() {
  return monthlySpent;
}

export function checkCostGuard(config: CostGuardConfig, estimatedCost: number) {
  if (estimatedCost > config.maxRequestCostEur) {
    return {
      allowed: false,
      reason: 'Single request exceeds cost guard'
    };
  }

  if (monthlySpent + estimatedCost > config.maxMonthlyBudgetEur) {
    return {
      allowed: false,
      reason: 'Monthly budget exceeded'
    };
  }

  return { allowed: true };
}
