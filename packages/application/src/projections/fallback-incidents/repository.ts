export type FallbackIncidentReason =
  | "webgpu_unavailable"
  | "module_load_failed"
  | "worker_timeout"
  | "api_timeout"
  | "device_constraint";

export type ExperienceMode =
  | "immersive"
  | "kinetic"
  | "assisted"
  | "static_luxury"
  | "safe_mode";

export interface FallbackIncidentAggregateSnapshot {
  tenantId: string;
  window: "5m" | "15m" | "1h";
  totalCount: number;
  byReason: Record<FallbackIncidentReason, number>;
  byTransition: Array<{
    fromMode: ExperienceMode;
    toMode: ExperienceMode;
    count: number;
  }>;
  latestIncidentAt: string | null;
  lastTraceId: string | null;
  updatedAt: string;
}

export interface FallbackIncidentsReadModelRepository {
  incrementFallbackIncident(params: {
    tenantId: string;
    traceId: string;
    reason: FallbackIncidentReason;
    fromMode: ExperienceMode;
    toMode: ExperienceMode;
    occurredAt: string;
  }): Promise<void>;

  getSnapshot(params: {
    tenantId: string;
    window: "5m" | "15m" | "1h";
  }): Promise<FallbackIncidentAggregateSnapshot | null>;
}
