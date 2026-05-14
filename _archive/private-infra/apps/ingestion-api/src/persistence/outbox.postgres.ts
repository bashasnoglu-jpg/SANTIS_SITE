import { db } from "../db.js";
import { outboxEvents } from "@santis/db";
import { eq } from "drizzle-orm";
import { SantisEvent } from "@santis/event-dictionary";
import { OutboxRepository, OutboxAdminRepository } from "@santis/application/outbox/repository";

export type PendingOutboxRecord = {
  id: string;
  eventType: string;
  payloadJson: string;
  traceId: string;
  status: "pending" | "published" | "failed";
  failureReason?: string;
};

export class PostgresOutboxRepository implements OutboxRepository, OutboxAdminRepository {
  async savePending(event: SantisEvent): Promise<void> {
    await db.insert(outboxEvents).values({
      id: event.eventId,
      eventType: event.eventType,
      payload: event,
      status: "pending",
      traceId: event.traceId,
    });
  }

  async fetchPending(limit: number): Promise<PendingOutboxRecord[]> {
    const records = await db.query.outboxEvents.findMany({
      where: (outboxEvents, { eq }) => eq(outboxEvents.status, "pending"),
      limit,
      orderBy: (outboxEvents, { asc }) => [asc(outboxEvents.createdAt)]
    });

    return records.map(r => ({
      id: r.id,
      eventType: r.eventType,
      payloadJson: JSON.stringify(r.payload),
      traceId: r.traceId,
      status: r.status as "pending" | "published" | "failed",
    }));
  }

  async markPublished(id: string): Promise<void> {
    await db.update(outboxEvents)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(outboxEvents.id, id));
  }

  async markFailed(id: string, reason: string): Promise<void> {
    // In our schema we don't have failureReason yet, but we update status
    // To support failureReason we'd need to alter schema or save in payload
    await db.update(outboxEvents)
      .set({ status: "failed" })
      .where(eq(outboxEvents.id, id));
  }
}
