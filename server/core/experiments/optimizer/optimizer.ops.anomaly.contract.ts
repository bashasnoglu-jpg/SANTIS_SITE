export type OptimizerAnomalyType =
  | 'exploration_spike'
  | 'allowed_drop'
  | 'risk_surge'
  | 'blocked_spike';

export interface OptimizerAnomaly {
  type: OptimizerAnomalyType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: string;
}
