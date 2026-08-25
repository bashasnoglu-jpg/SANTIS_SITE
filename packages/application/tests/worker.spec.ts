import { describe, it, expect, beforeEach, vi } from "vitest";
import { drainOutbox, type OutboxPublisher } from "../src/outbox/worker.js";
import { SovereignBus } from "@santis/sovereign-bus";
import type { OutboxAdminRepository } from "../src/outbox/repository.js";
import type { SantisEvent } from "@santis-core/event-contracts";

class InMemoryOutboxRepository implements OutboxAdminRepository {
  public events: any[] = [];
  async fetchPending(limit: number): Promise<any[]> {
    return this.events.filter(e => e.outboxStatus === 'pending').slice(0, limit);
  }
  async markPublished(id: string): Promise<void> {
    const e = this.events.find(x => x.id === id);
    if(e) e.outboxStatus = 'published';
  }
  async markFailed(id: string, reason: string): Promise<void> {
    const e = this.events.find(x => x.id === id);
    if(e) e.outboxStatus = 'failed';
  }
  async append(raw: any) {
    this.events.push({ ...raw, outboxStatus: 'pending', id: crypto.randomUUID() });
  }
}

class TestOutboxPublisher implements OutboxPublisher {
  constructor(private bus: SovereignBus) {}
  async publish(record: any): Promise<void> {
    // Deserialize event and publish to bus
    const event = JSON.parse(record.payloadJson);
    await this.bus.events.publish(event);
  }
}

describe("Outbox Worker (Drain Process)", () => {
  let outboxRepo: InMemoryOutboxRepository;
  let bus: SovereignBus;
  let publisher: TestOutboxPublisher;

  beforeEach(() => {
    outboxRepo = new InMemoryOutboxRepository();
    bus = new SovereignBus();
    publisher = new TestOutboxPublisher(bus);
  });

  it("should drain pending events and publish them to the Event Bus", async () => {
    // 1. Bus'ı dinleyen bir ajan (spy) oluştur
    const publishSpy = vi.spyOn(bus.events, "publish").mockResolvedValue();

    const mockEvent = {
        eventId: "evt-1",
        eventType: "experience.interaction.mood_selected",
        traceId: "trace-1",
        payload: { mood: "recovery" },
        occurredAt: new Date().toISOString()
    };

    // 2. Outbox'a sahte bir bekleyen (pending) event ekle
    await outboxRepo.append({
      eventType: "experience.interaction.mood_selected",
      traceId: "trace-1",
      payloadJson: JSON.stringify(mockEvent)
    });

    // 3. Worker'ı tetikle
    await drainOutbox({ repo: outboxRepo, publisher });

    // 4. Event Bus'a publish edildiğini doğrula
    expect(publishSpy).toHaveBeenCalledTimes(1);

    // 5. Outbox'ta bekleyen (pending) event kalmadığını doğrula (Marked as processed)
    const pendingAfter = await outboxRepo.fetchPending(10);
    expect(pendingAfter).toHaveLength(0);
  });
});
