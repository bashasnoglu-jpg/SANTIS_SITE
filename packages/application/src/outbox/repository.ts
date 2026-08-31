import type { SantisEvent } from "@santis-core/event-contracts";

export interface OutboxRepository {
  savePending(event: SantisEvent): Promise<void>;
}

export interface OutboxAdminRepository {
  fetchPending(limit: number): Promise<Array<{
    id: string;
    eventType: string;
    payloadJson: string;
    traceId: string;
  }>>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
}
