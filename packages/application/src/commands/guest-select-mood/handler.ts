import type { SantisCommand } from "@santis/event-dictionary";
import type { CommandResult } from "@santis/event-dictionary/command-result";
import type { SelectMoodApplicationService } from "./service.js";

type SelectMoodCommand = Extract<
  SantisCommand,
  { commandType: "guest.select_mood" }
>;

export function createGuestSelectMoodHandler(
  service: SelectMoodApplicationService
) {
  return async function handle(
    command: SelectMoodCommand
  ): Promise<CommandResult> {
    return service.execute(command);
  };
}
