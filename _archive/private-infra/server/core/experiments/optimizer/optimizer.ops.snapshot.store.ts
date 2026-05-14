import type { ConstraintAwareBanditOutput } from './optimizer.bandit.constraint-aware.adapter.ts';
import type { PortfolioOutput } from './optimizer.portfolio.contract.ts';

export interface OptimizerDecisionSnapshot {
  experimentId: string;
  requestId: string;
  constrained: ConstraintAwareBanditOutput;
  portfolio: PortfolioOutput;
  savedAt: string;
}

export interface OptimizerDecisionSnapshotStore {
  save(snapshot: OptimizerDecisionSnapshot): Promise<void>;
  getLatest(params: {
    experimentId: string;
    requestId?: string;
  }): Promise<OptimizerDecisionSnapshot | null>;
  getRange(params: {
    experimentId: string;
    from: string;
    to: string;
    limit?: number;
  }): Promise<OptimizerDecisionSnapshot[]>;
}
