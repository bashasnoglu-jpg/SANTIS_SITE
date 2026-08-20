export type SignalType =
  | "stress_index"
  | "hesitation_index"
  | "abandon_risk"
  | "therapist_stress";

export interface TelemetryContext {
  page?: string;
  component?: string;
  sessionId?: string;
  pathname?: string;
  frictionSource?: string;
}

export interface TelemetrySignal {
  id: string;
  userId: string;
  signalType: SignalType;
  value: number;
  context?: TelemetryContext | null;
  createdAt?: Date | null;
}
