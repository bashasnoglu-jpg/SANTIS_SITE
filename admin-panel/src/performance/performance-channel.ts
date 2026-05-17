/**
 * Performance event types tracked by the Santis observability rail.
 * v1: local only — no network beacons until metrics are stable.
 */
export type PerformanceEvent =
  | { type: "fps.sample"; fps: number; droppedFrames: number; sampledAt: number }
  | { type: "layout.shift"; value: number; sampledAt: number };

/**
 * Emits a performance event.
 * In development: logs to console.
 * In production: no-op until a stable metrics sink is wired in.
 */
export function emitPerformanceEvent(event: PerformanceEvent): void {
  if (import.meta.env.DEV) {
    console.info("[Santis Performance]", event);
  }
}
