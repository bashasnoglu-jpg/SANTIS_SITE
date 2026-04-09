import type { OutboxAdminRepository } from "./repository.js";

export interface OutboxPublisher {
  publish(record: {
    id: string;
    eventType: string;
    payloadJson: string;
    traceId: string;
  }): Promise<void>;
}

export async function drainOutbox(params: {
  repo: OutboxAdminRepository;
  publisher: OutboxPublisher;
  limit?: number;
}): Promise<void> {
  const records = await params.repo.fetchPending(params.limit ?? 100);

  for (const record of records) {
    try {
      await params.publisher.publish(record);
      await params.repo.markPublished(record.id);
    } catch (error) {
      await params.repo.markFailed(
        record.id,
        error instanceof Error ? error.message : "Unknown outbox publish error"
      );
    }
  }
}
