import type { SovereignBus } from "../../sovereign-bus/src/index.js";
import { SelectMoodApplicationService } from "../commands/guest-select-mood/service.js";
import { createGuestSelectMoodHandler } from "../commands/guest-select-mood/handler.js";
import { createMoodReadModelProjection } from "../projections/mood-read-model/subscriber.js";
import type { UnitOfWork } from "../uow/index.js";
import type { GuestSessionRepository } from "../repositories/guest-session-repository.js";
import type { IntentSnapshotRepository } from "../repositories/intent-snapshot-repository.js";
import type { OutboxRepository } from "../outbox/repository.js";
import type { MoodReadModelRepository } from "../projections/mood-read-model/repository.js";

export function registerGuestSelectMoodFlow(params: {
  bus: SovereignBus;
  uow: UnitOfWork;
  guestSessionRepo: GuestSessionRepository;
  intentSnapshotRepo: IntentSnapshotRepository;
  outboxRepo: OutboxRepository;
  moodReadModelRepo: MoodReadModelRepository;
}): void {
  const service = new SelectMoodApplicationService({
    bus: params.bus,
    uow: params.uow,
    guestSessionRepo: params.guestSessionRepo,
    intentSnapshotRepo: params.intentSnapshotRepo,
    outboxRepo: params.outboxRepo,
  });

  params.bus.commands.registerHandler(
    "guest.select_mood",
    createGuestSelectMoodHandler(service)
  );

  params.bus.events.subscribe(
    "experience.interaction.mood_selected",
    createMoodReadModelProjection(params.moodReadModelRepo)
  );
}
