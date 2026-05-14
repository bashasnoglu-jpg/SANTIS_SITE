import type { ExperimentDefinition } from '../contracts/experiment.contract.ts';

export function createExperimentFromOptimizer(
  recommendation: {
    key: string;
    currentValue: number;
    suggestedValue: number;
  }
): ExperimentDefinition {

  return {
    id: `exp_${Date.now()}`,
    key: recommendation.key,

    status: 'running',
    startAt: new Date().toISOString(),

    targetMetric: 'revenue',

    trafficAllocation: {
      control: 0.5,
      variant_a: 0.5
    },

    variants: {
      control: {
        [recommendation.key]: recommendation.currentValue
      },
      variant_a: {
        [recommendation.key]: recommendation.suggestedValue
      }
    }
  };
}
