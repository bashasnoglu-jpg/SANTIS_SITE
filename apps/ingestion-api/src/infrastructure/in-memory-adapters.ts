import type { SantisEvent } from "@santis/event-dictionary";
import type { GuestSessionRepository } from "@santis/application/repositories/guest-session-repository";
import type { IntentSnapshotRepository } from "@santis/application/repositories/intent-snapshot-repository";
import type {
  OutboxAdminRepository,
  OutboxRepository,
} from "@santis/application/outbox/repository";
import type { MoodReadModelRepository } from "@santis/application/projections/mood-read-model/repository";

export class InMemoryGuestSessionRepository implements GuestSessionRepository {
  private readonly writes: Array<{
    tenantId: string;
    sessionId: string;
    mood: string;
    selectedAt: string;
  }> = [];

  async markMoodSelected(params: {
    tenantId: string;
    sessionId: string;
    mood: string;
    selectedAt: string;
  }): Promise<void> {
    this.writes.push(params);
  }
}

export class InMemoryIntentSnapshotRepository implements IntentSnapshotRepository {
  private readonly writes: Array<{
    tenantId: string;
    sessionId: string;
    moodAffinity: string[];
    updatedAt: string;
  }> = [];

  async upsertIntentSnapshot(params: {
    tenantId: string;
    sessionId: string;
    moodAffinity: string[];
    updatedAt: string;
  }): Promise<void> {
    this.writes.push(params);
  }

  async findBySessionId(sessionId: string): Promise<{
    tenantId: string;
    sessionId: string;
    moodAffinity: string[];
    updatedAt: string;
  } | null> {
    return [...this.writes].reverse().find((w) => w.sessionId === sessionId) ?? null;
  }
}

export type PendingOutboxRecord = {
  id: string;
  eventType: string;
  payloadJson: string;
  traceId: string;
  status: "pending" | "published" | "failed";
  failureReason?: string;
};

export class InMemoryOutboxRepository implements OutboxRepository, OutboxAdminRepository {
  private readonly records: PendingOutboxRecord[] = [];

  async savePending(event: SantisEvent): Promise<void> {
    this.records.push({
      id: event.eventId,
      eventType: event.eventType,
      payloadJson: JSON.stringify(event),
      traceId: event.traceId,
      status: "pending",
    });
  }

  async fetchPending(limit: number): Promise<PendingOutboxRecord[]> {
    return this.records.filter((r) => r.status === "pending").slice(0, limit);
  }

  async markPublished(id: string): Promise<void> {
    const record = this.records.find((r) => r.id === id);
    if (record) {
      record.status = "published";
    }
  }

  async markFailed(id: string, reason: string): Promise<void> {
    const record = this.records.find((r) => r.id === id);
    if (record) {
      record.status = "failed";
      record.failureReason = reason;
    }
  }
}

export class InMemoryMoodReadModelRepository implements MoodReadModelRepository {
  private readonly rows: Array<{
    hotelId: string;
    mood: string;
    occurredAt: string;
  }> = [];

  async incrementSelection(params: {
    hotelId: string;
    mood: string;
    occurredAt: string;
  }): Promise<void> {
    this.rows.push(params);
  }
}
