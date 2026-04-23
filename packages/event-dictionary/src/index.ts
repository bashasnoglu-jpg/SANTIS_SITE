import type { TelemetrySignal } from '@santis/domain-schema/telemetry';

// Katı Override Modelleri
export type BoardroomOverrideMode = "force_reduce" | "force_normal" | "resume_autonomy";

export type ConciergeEvent = 
  | { type: 'SIGNAL_RECEIVED'; signal: TelemetrySignal }
  | { type: 'BOARDROOM_OVERRIDE'; mode: BoardroomOverrideMode };
