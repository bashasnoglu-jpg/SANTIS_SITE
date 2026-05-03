export interface StrategyVariant {
  id: string;
  label: string;

  expectedDelta: number; // +€ or %
  confidence: number;
  riskScore: number;     // 0..1

  reasoning: string[];
}

export interface StrategyProposal {
  strategyId: string;

  variants: StrategyVariant[];

  recommendedVariantId: string;

  createdAt: number;
}
