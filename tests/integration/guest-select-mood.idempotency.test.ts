import { describe, it, expect } from "vitest";
import { SovereignBus } from "../../packages/sovereign-bus/src/index.js";
import { InMemoryUnitOfWork } from "../../packages/application/src/uow/in-memory-uow.js";
import { registerGuestSelectMoodFlow } from "../../packages/application/src/bootstrap/register-guest-select-mood.js";
import { CommandIngressService } from "../../apps/ingestion-api/src/services/command-ingress.js";
import { makeRawSelectMoodCommand } from "../helpers/fixtures.js";
import {
  InMemoryGuestSessionRepository,
  InMemoryIntentSnapshotRepository,
  InMemoryMoodReadModelRepository,
  InMemoryOutboxRepository,
  InMemoryProcessedCommandStore,
} from "../helpers/in-memory-fakes.js";

describe("guest.select_mood - idempotency", () => {
  it("should not materialize the same command twice", async () => {
    const bus = new SovereignBus();
    const uow = new InMemoryUnitOfWork();
    const guestSessionRepo = new InMemoryGuestSessionRepository();
    const intentSnapshotRepo = new InMemoryIntentSnapshotRepository();
    const outboxRepo = new InMemoryOutboxRepository();
    const moodReadModelRepo = new InMemoryMoodReadModelRepository();
    const processedStore = new InMemoryProcessedCommandStore();

    registerGuestSelectMoodFlow({
      bus,
      uow,
      guestSessionRepo,
      intentSnapshotRepo,
      outboxRepo,
      moodReadModelRepo,
    });

    const ingress = new CommandIngressService(bus.commands);
    const rawCommand = makeRawSelectMoodCommand();

    async function idempotentIngest(raw: unknown) {
      const command = raw as ReturnType<typeof makeRawSelectMoodCommand>;

      if (processedStore.has(command.commandId)) {
        return processedStore.get(command.commandId);
      }

      const result = await ingress.ingest(raw);
      processedStore.set(command.commandId, result);
      return result;
    }

    const first = await idempotentIngest(rawCommand);
    const second = await idempotentIngest(rawCommand);

    expect(first).toEqual(second);

    // Tek gerçeklik
    expect(guestSessionRepo.writes).toHaveLength(1);
    expect(intentSnapshotRepo.writes).toHaveLength(1);
    expect(outboxRepo.records).toHaveLength(1);
    expect(moodReadModelRepo.rows).toHaveLength(1);

    // Command iki kez "gelmiş" olabilir ama sistem onu bir kez materyalize etmeli
    const uniqueOutboxEventIds = new Set(outboxRepo.records.map((r) => r.id));
    expect(uniqueOutboxEventIds.size).toBe(1);
  });
});
