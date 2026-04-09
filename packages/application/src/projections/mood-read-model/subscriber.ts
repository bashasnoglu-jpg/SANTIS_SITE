import type { EventOfType } from "@santis/sovereign-bus";
import type { MoodReadModelRepository } from "./repository.js";

export function createMoodReadModelProjection(
  repo: MoodReadModelRepository
) {
  return async function onMoodSelected(
    event: EventOfType<"experience.interaction.mood_selected">
  ): Promise<void> {
    await repo.incrementSelection({
      hotelId: event.tenant.hotelId,
      mood: event.payload.mood,
      occurredAt: event.occurredAt,
    });
  };
}
