export type Snapshot<TState = unknown, TProjection = unknown> = {
  id: string;
  ts: number;
  state: TState;
  projection?: TProjection;
  eventCursor?: number;
  reason?: string;
};

export type SnapshotRingOptions = {
  maxSnapshots: number;
  maxAgeMs?: number;
};

export class SnapshotRing<TState = unknown, TProjection = unknown> {
  private items: Snapshot<TState, TProjection>[] = [];
  private readonly maxSnapshots: number;
  private readonly maxAgeMs?: number;

  constructor(options?: Partial<SnapshotRingOptions>) {
    this.maxSnapshots = options?.maxSnapshots ?? 50;
    this.maxAgeMs = options?.maxAgeMs;
  }

  push(snapshot: Snapshot<TState, TProjection>) {
    this.items.push(snapshot);
    this.prune();
  }

  list() {
    return [...this.items];
  }

  latest() {
    return this.items[this.items.length - 1] ?? null;
  }

  getById(id: string) {
    return this.items.find((x) => x.id === id) ?? null;
  }

  clear() {
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  private prune() {
    if (this.maxAgeMs) {
      const cutoff = Date.now() - this.maxAgeMs;
      this.items = this.items.filter((x) => x.ts >= cutoff);
    }

    if (this.items.length > this.maxSnapshots) {
      this.items.splice(0, this.items.length - this.maxSnapshots);
    }
  }
}
