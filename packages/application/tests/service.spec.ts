import { describe, it, expect, beforeEach, vi } from "vitest";
import { SelectMoodApplicationService } from "../src/commands/guest-select-mood/service.js";
import { InMemoryUnitOfWork } from "../src/uow/in-memory-uow.js";
import type { GuestSessionRepository } from "../src/repositories/guest-session-repository.js";
import type { IntentSnapshotRepository } from "../src/repositories/intent-snapshot-repository.js";
import type { OutboxRepository, OutboxAdminRepository } from "../src/outbox/repository.js";
import { SovereignBus } from "@santis/sovereign-bus";
import { z } from "zod";
import type { SantisCommand, SantisEvent } from "@santis/event-dictionary";

type SelectMoodCommand = Extract<SantisCommand, { commandType: "guest.select_mood" }>;

class InMemoryGuestSessionRepository implements GuestSessionRepository {
  public sessions = new Map<string, any>();
  async markMoodSelected(params: any): Promise<void> {
    this.sessions.set(params.sessionId, params);
  }
}

class InMemoryIntentSnapshotRepository implements IntentSnapshotRepository {
  public intents = new Map<string, any>();
  async upsertIntentSnapshot(params: any): Promise<void> {
    this.intents.set(params.sessionId, params);
  }
  async findById(sessionId: string) {
    return this.intents.get(sessionId);
  }
}

class InMemoryOutboxRepository implements OutboxRepository, OutboxAdminRepository {
  public events: any[] = [];
  async savePending(event: SantisEvent): Promise<void> {
    this.events.push({ ...event, outboxStatus: 'pending', id: crypto.randomUUID(), payloadJson: JSON.stringify(event) });
  }
  async getPendingEvents(limit: number) {
    return this.events.filter(e => e.outboxStatus === 'pending').slice(0, limit);
  }
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

describe("Application Service: Select Mood", () => {
  let uow: InMemoryUnitOfWork;
  let sessionRepo: InMemoryGuestSessionRepository;
  let intentRepo: InMemoryIntentSnapshotRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let bus: SovereignBus;
  let service: SelectMoodApplicationService;

  const validCommand: SelectMoodCommand = {
    commandType: "guest.select_mood",
    commandId: "cmd-123",
    requestedAt: new Date().toISOString(),
    tenantId: "tenant-1",
    sessionId: "session-xyz",
    traceId: "trace-999",
    payload: { mood: "deep_relaxation" }
  };

  beforeEach(() => {
    uow = new InMemoryUnitOfWork();
    sessionRepo = new InMemoryGuestSessionRepository();
    intentRepo = new InMemoryIntentSnapshotRepository();
    outboxRepo = new InMemoryOutboxRepository();
    bus = new SovereignBus();
    service = new SelectMoodApplicationService({ uow, guestSessionRepo: sessionRepo, intentSnapshotRepo: intentRepo, outboxRepo, bus });
  });

  it("should successfully process command, commit UoW, and append to Outbox (Happy Path)", async () => {
    const result = await service.execute(validCommand);

    // 1. Command başarılı olmalı (Ack)
    expect(result.status).toBe("ack");
    expect((result as any).mode).toBeDefined();

    // 2. Intent Repo'ya kaydedilmiş olmalı
    const savedIntent = await intentRepo.findById(validCommand.sessionId);
    expect(savedIntent).toBeDefined();
    expect(savedIntent?.moodAffinity).toContain("deep_relaxation");

    // 3. Outbox'a bir event düşmüş olmalı
    const pendingEvents = await outboxRepo.getPendingEvents(10);
    expect(pendingEvents).toHaveLength(1);
    expect(pendingEvents[0].eventType).toBe("experience.interaction.mood_selected");

    // 4. TraceId kaybolmamış olmalı!
    expect(pendingEvents[0].traceId).toBe("trace-999");
  });

  it("should rollback UoW and return Nack if a repository fails (Failure Mode)", async () => {
    // KAOS MÜDAHALESİ: Intent Repository'nin metodunu bilerek bozuyoruz
    vi.spyOn(intentRepo, "upsertIntentSnapshot").mockRejectedValue(new Error("Veritabanı bağlantısı koptu!"));

    const result = await service.execute(validCommand);

    // 1. Command reddedilmeli (Nack)
    expect(result.status).toBe("nack");
    expect((result as any).message).toContain("Veritabanı bağlantısı koptu");

    // 2. Outbox TERTEMİZ kalmalı (Rollback çalıştı!)
    const pendingEvents = await outboxRepo.getPendingEvents(10);
    expect(pendingEvents).toHaveLength(0); // Hiçbir hayalet event outbox'a sızmadı!
  });
});
