import { SnapshotRing, type Snapshot } from './snapshot-ring';
export { restoreSnapshot } from './time-travel-restore';

export type AppState = Record<string, unknown>;
export type ProjectionState = Record<string, unknown>;

const snapshotRing = new SnapshotRing<AppState, ProjectionState>({
  maxSnapshots: 50,
  maxAgeMs: 1000 * 60 * 30
});

function cloneSafe<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function recordSnapshot(params: {
  state: AppState;
  projection?: ProjectionState;
  eventCursor?: number;
  reason?: string;
}) {
  const snapshot: Snapshot<AppState, ProjectionState> = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    state: cloneSafe(params.state),
    projection: params.projection ? cloneSafe(params.projection) : undefined,
    eventCursor: params.eventCursor,
    reason: params.reason
  };

  snapshotRing.push(snapshot);
  return snapshot;
}

export function listSnapshots() {
  return snapshotRing.list();
}

export function getSnapshotById(id: string) {
  return snapshotRing.getById(id);
}

export function getLatestSnapshot() {
  return snapshotRing.latest();
}

export function clearSnapshots() {
  snapshotRing.clear();
}

export function getSnapshotCount() {
  return snapshotRing.size();
}
