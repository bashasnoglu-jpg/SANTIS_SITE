import type { EventOfType } from "../../../sovereign-bus/src/index.js";
import type { FallbackIncidentsReadModelRepository } from "./repository.js";

export function createFallbackIncidentsProjection(
  repo: FallbackIncidentsReadModelRepository
) {
  return async function onFallbackEngaged(
    event: EventOfType<"risk.fallback.engaged">
  ): Promise<void> {
    await repo.incrementFallbackIncident({
      tenantId: event.tenant.hotelId,
      traceId: event.traceId,
      reason: event.payload.reason,
      fromMode: event.payload.fromMode,
      toMode: event.payload.toMode,
      occurredAt: event.occurredAt,
    });
  };
}
