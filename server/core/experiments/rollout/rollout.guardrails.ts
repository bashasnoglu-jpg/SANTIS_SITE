import type { RolloutGuardrails } from './rollout.contract.ts';
import { DEFAULT_ROLLOUT_GUARDRAILS } from './rollout.contract.ts';

export class StaticRolloutGuardrailProvider {
  constructor(
    private readonly perExperiment: Record<string, RolloutGuardrails> = {}
  ) {}

  async getForExperiment(experimentId: string): Promise<RolloutGuardrails> {
    return this.perExperiment[experimentId] ?? DEFAULT_ROLLOUT_GUARDRAILS;
  }
}
