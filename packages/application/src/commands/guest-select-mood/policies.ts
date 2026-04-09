import type { SantisCommand } from "@santis/event-dictionary";
import { SelectMoodPolicyError } from "./errors.js";

type SelectMoodCommand = Extract<
  SantisCommand,
  { commandType: "guest.select_mood" }
>;

export function assertSelectMoodPolicy(command: SelectMoodCommand): void {
  if (!command.tenantId) {
    throw new SelectMoodPolicyError("tenantId is required");
  }

  if (!command.sessionId) {
    throw new SelectMoodPolicyError("sessionId is required");
  }

  if (!command.payload?.mood) {
    throw new SelectMoodPolicyError("mood is required");
  }
}
