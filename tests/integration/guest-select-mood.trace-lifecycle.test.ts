import { describe, it, expect } from "vitest";
import { SovereignBus } from "../../packages/sovereign-bus/src/index.js";
import { InMemoryUnitOfWork } from "../../packages/application/src/uow/in-memory-uow.js";
import { registerGuestSelectMoodFlow } from "../../packages/application/src/bootstrap/register-guest-select-mood.js";
import { createMoodReadModelProjection } from "../../packages/application/src/projections/mood-read-model/subscriber.js";
import { CommandIngressService } from "../../apps/ingestion-api/src/services/command-ingress.js";
import { makeRawSelectMoodCommand } from "../helpers/fixtures.js";
import {
  InMemoryGuestSessionRepository,
  InMemoryIntentSnapshotRepository,
  InMemoryMoodReadModelRepository,
  InMemoryOutboxRepository,
  TraceLogCollector,
} from "../helpers/in-memory-fakes.js";

describe("guest.select_mood - trace lifecycle", () => {
  it("should preserve traceId across ingress -> service -> outbox -> projection", async () => {
    const bus = new SovereignBus();
    const uow = new InMemoryUnitOfWork();
    const guestSessionRepo = new InMemoryGuestSessionRepository();
    const intentSnapshotRepo = new InMemoryIntentSnapshotRepository();
    const outboxRepo = new InMemoryOutboxRepository();
    const moodReadModelRepo = new InMemoryMoodReadModelRepository();
    const traceLogs = new TraceLogCollector();

    bus.addObserver({
      onCommandDispatched(command) {
        traceLogs.log({
          layer: "bus",
          action: "command.bus.dispatched",
          traceId: command.traceId,
          commandId: command.commandId,
        });
      },
      onEventPublished(event) {
        traceLogs.log({
          layer: "event-bus",
          action: "event.bus.published",
          traceId: event.traceId,
          eventId: event.eventId,
          eventType: event.eventType,
        });
      },
    });

    registerGuestSelectMoodFlow({
      bus,
      uow,
      guestSessionRepo,
      intentSnapshotRepo,
      outboxRepo,
      moodReadModelRepo,
    });

    // Projection loglamak için ek abone
    bus.events.subscribe(
      "experience.interaction.mood_selected",
      async (event) => {
        traceLogs.log({
          layer: "projection",
          action: "projection.mood_summary.updated",
          traceId: event.traceId,
          eventId: event.eventId,
        });
      }
    );

    const ingress = new CommandIngressService(bus.commands);
    const rawCommand = makeRawSelectMoodCommand();

    traceLogs.log({
      layer: "ingress",
      action: "command.ingress.received",
      traceId: rawCommand.traceId,
      commandId: rawCommand.commandId,
    });

    const response = await ingress.ingest(rawCommand);

    expect(response.ok).toBe(true);
    if (!response.ok) return;

    const result = response.result;
    expect(result.status).toBe("ack");
    if (result.status !== "ack") return;

    expect(result.traceId).toBe(rawCommand.traceId);

    // Repo yazımları
    expect(guestSessionRepo.writes).toHaveLength(1);
    expect(intentSnapshotRepo.writes).toHaveLength(1);

    // Outbox
    expect(outboxRepo.records).toHaveLength(1);
    expect(outboxRepo.records[0].traceId).toBe(rawCommand.traceId);

    // Projection
    expect(moodReadModelRepo.rows).toHaveLength(1);
    expect(moodReadModelRepo.rows[0].mood).toBe("deep_relaxation");

    // Trace zinciri
    const logs = traceLogs.byTraceId(rawCommand.traceId);
    expect(logs.length).toBeGreaterThanOrEqual(3);

    const actions = logs.map((l) => l.action);
    expect(actions).toContain("command.ingress.received");
    expect(actions).toContain("command.bus.dispatched");
    expect(actions).toContain("event.bus.published");
    expect(actions).toContain("projection.mood_summary.updated");
  });
});
