export type ExperimentVariant = 'control' | 'variant_a' | 'variant_b';

export interface ExperimentDefinition {
  id: string;
  key: string; // ex: "quote_latency_threshold_test"

  trafficAllocation: {
    control: number;   // 0.5
    variant_a: number; // 0.25
    variant_b?: number; // 0.25
  };

  status: 'draft' | 'running' | 'paused' | 'completed';

  startAt: string;
  endAt?: string;

  targetMetric: 'revenue' | 'intent_rate' | 'abandonment_rate';

  variants: {
    control: Record<string, any>;
    variant_a: Record<string, any>;
    variant_b?: Record<string, any>;
  };
}
