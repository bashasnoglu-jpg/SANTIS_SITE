import { OptimizerPolicyRolloutWorker } from './optimizer.policy.rollout.worker.ts';

export class OptimizerPolicyRolloutScheduler {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly worker: OptimizerPolicyRolloutWorker,
    private readonly intervalMs: number = 15_000,
  ) {}

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.worker.tick().catch((error) => {
        console.error('[OptimizerPolicyRolloutScheduler] tick failed', error);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}
