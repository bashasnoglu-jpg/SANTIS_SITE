import type {
  CommandResult,
  SantisCommand,
} from "@santis-core/event-contracts";
import type { SovereignBus } from "@santis/sovereign-bus";
import type { UnitOfWork } from "../../uow/index.js";
import type { GuestSessionRepository } from "../../repositories/guest-session-repository.js";
import type { IntentSnapshotRepository } from "../../repositories/intent-snapshot-repository.js";
import type { OutboxRepository } from "../../outbox/repository.js";
import { ack, nack } from "../../shared/command-result-helpers.js";
import { assertSelectMoodPolicy } from "./policies.js";
import { mapSelectMoodCommandToEvent } from "./mapper.js";

type SelectMoodCommand = Extract<
  SantisCommand,
  { commandType: "guest.select_mood" }
>;

export interface SelectMoodServiceDeps {
  uow: UnitOfWork;
  guestSessionRepo: GuestSessionRepository;
  intentSnapshotRepo: IntentSnapshotRepository;
  outboxRepo: OutboxRepository;
  bus: SovereignBus;
}

export class SelectMoodApplicationService {
  constructor(private readonly deps: SelectMoodServiceDeps) {}

  async execute(command: SelectMoodCommand): Promise<CommandResult> {
    try {
      assertSelectMoodPolicy(command);

      const committedEvents = await this.deps.uow.runInTransaction(async (tx) => {
        const now = new Date().toISOString();

        await this.deps.guestSessionRepo.markMoodSelected({
          tenantId: command.tenant.hotelId,
          sessionId: command.sessionId,
          mood: command.payload.mood,
          selectedAt: now,
        });

        await this.deps.intentSnapshotRepo.upsertIntentSnapshot({
          tenantId: command.tenant.hotelId,
          sessionId: command.sessionId,
          moodAffinity: [command.payload.mood],
          updatedAt: now,
        });

        const event = mapSelectMoodCommandToEvent({
          command,
          tenant: {
            hotelId: command.tenant.hotelId,
            hotelCode: "SANTIS01",
            region: "EU",
            locale: "tr",
            currency: "EUR",
            activePolicies: [],
            fallbackMode: false,
          },
          intent: {
            isReturningGuest: false,
            segment: "explorer",
            moodAffinity: [command.payload.mood],
            premiumThreshold: 50,
          },
          source: "ritual_builder",
        });

        tx.addEvent(event);
        await this.deps.outboxRepo.savePending(event);

        return tx.events;
      });

      for (const event of committedEvents) {
        await this.deps.bus.events.publish(event);
      }

      return ack({
        commandId: command.commandId,
        traceId: command.traceId,
        mode: "sync_completed",
        message: "Mood selection processed successfully",
        commandType: command.commandType,
        resultingEventTypes: committedEvents.map((e) => e.eventType),
        resultingEventIds: committedEvents.map((e) => e.eventId),
      });
    } catch (error) {
      return nack({
        commandId: command.commandId,
        traceId: command.traceId,
        reasonCode: "handler_failed",
        message:
          error instanceof Error ? error.message : "Select mood flow failed",
        retryable: true,
      });
    }
  }
}
