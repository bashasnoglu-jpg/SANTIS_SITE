export type SantisEvent = {
  eventId: string;
  eventType: string;
  traceId: string;
  payload?: unknown;
};
import type {
  GuestSessionRepository,
} from "../../packages/application/src/repositories/guest-session-repository.js";
import type {
  IntentSnapshotRepository,
} from "../../packages/application/src/repositories/intent-snapshot-repository.js";
import type {
  OutboxAdminRepository,
  OutboxRepository,
} from "../../packages/application/src/outbox/repository.js";
import type {
  MoodReadModelRepository,
} from "../../packages/application/src/projections/mood-read-model/repository.js";

export class InMemoryGuestSessionRepository implements GuestSessionRepository {
  public writes: Array<{
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

export class InMemoryIntentSnapshotRepository
  implements IntentSnapshotRepository
{
  public writes: Array<{
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
    const existing = [...this.writes].reverse().find((w) => w.sessionId === sessionId);
    return existing || null;
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

export class InMemoryOutboxRepository
  implements OutboxRepository, OutboxAdminRepository
{
  public records: PendingOutboxRecord[] = [];

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
    if (record) record.status = "published";
  }

  async markFailed(id: string, reason: string): Promise<void> {
    const record = this.records.find((r) => r.id === id);
    if (record) {
      record.status = "failed";
      record.failureReason = reason;
    }
  }
}

export class InMemoryMoodReadModelRepository
  implements MoodReadModelRepository
{
  public rows: Array<{
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

export class TraceLogCollector {
  public logs: Array<Record<string, unknown>> = [];

  log(entry: Record<string, unknown>) {
    this.logs.push(entry);
  }

  byTraceId(traceId: string) {
    return this.logs.filter((l) => l.traceId === traceId);
  }
}

/**
 * Basit processed-command receipt store.
 * Aynı commandId ikinci kez işlenirse duplicate'i bloklar.
 */
export class InMemoryProcessedCommandStore {
  private readonly results = new Map<string, unknown>();

  has(commandId: string): boolean {
    return this.results.has(commandId);
  }

  get(commandId: string): unknown {
    return this.results.get(commandId);
  }

  set(commandId: string, result: unknown): void {
    this.results.set(commandId, result);
  }
}

export class MockCommandIngressService {
  constructor(private commandsBus: any) {}

  async ingest(rawCommand: any) {
    if (!rawCommand.payload || Object.keys(rawCommand.payload).length === 0) {
      return { ok: false, status: 400, error: { code: "validation_failed" } };
    }
    
    try {
      await this.commandsBus.dispatch(rawCommand);
      return { ok: true, result: { status: "ack", traceId: rawCommand.traceId } };
    } catch (e: any) {
      return { ok: false, status: 500, error: { code: "internal_error", message: e.message } };
    }
  }
}
