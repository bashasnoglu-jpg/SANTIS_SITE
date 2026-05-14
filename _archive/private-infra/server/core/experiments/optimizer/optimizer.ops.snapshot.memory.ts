import type {
  OptimizerDecisionSnapshot,
  OptimizerDecisionSnapshotStore,
} from './optimizer.ops.snapshot.store.ts';

export class InMemoryOptimizerDecisionSnapshotStore
  implements OptimizerDecisionSnapshotStore
{
  private readonly snapshots: OptimizerDecisionSnapshot[] = [];

  async save(snapshot: OptimizerDecisionSnapshot): Promise<void> {
    this.snapshots.push(snapshot);

    if (this.snapshots.length > 500) {
      this.snapshots.splice(0, this.snapshots.length - 500);
    }
  }

  async getLatest(params: {
    experimentId: string;
    requestId?: string;
  }): Promise<OptimizerDecisionSnapshot | null> {
    const filtered = this.snapshots.filter((snapshot) => {
      if (snapshot.experimentId !== params.experimentId) {
        return false;
      }

      if (params.requestId && snapshot.requestId !== params.requestId) {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      return null;
    }

    filtered.sort(
      (a, b) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    return filtered[0] ?? null;
  }

  async getRange(params: {
    experimentId: string;
    from: string;
    to: string;
    limit?: number;
  }): Promise<OptimizerDecisionSnapshot[]> {
    const fromTs = new Date(params.from).getTime();
    const toTs = new Date(params.to).getTime();
    const limit = params.limit ?? 200;

    return this.snapshots
      .filter((snapshot) => {
        if (snapshot.experimentId !== params.experimentId) {
          return false;
        }

        const ts = new Date(snapshot.savedAt).getTime();
        return ts >= fromTs && ts <= toTs;
      })
      .sort(
        (a, b) =>
          new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
      )
      .slice(-limit);
  }
}
