import { SantisCommandSchema } from "../../../../packages/event-dictionary/src/index.js";
import type { SovereignCommandBus } from "../../../../packages/sovereign-bus/src/index.js";
import type { CommandResult } from "../../../../packages/event-dictionary/src/command-result.js";

export type CommandIngressResult =
  | {
      ok: true;
      result: CommandResult;
    }
  | {
      ok: false;
      status: 400;
      error: {
        code: "validation_failed";
        message: string;
        details: unknown;
      };
    };

export class CommandIngressService {
  constructor(private readonly bus: SovereignCommandBus) {}

  async ingest(rawBody: unknown): Promise<CommandIngressResult> {
    const parsed = SantisCommandSchema.safeParse(rawBody);

    if (!parsed.success) {
      return {
        ok: false,
        status: 400,
        error: {
          code: "validation_failed",
          message: "Gönderilen komut Otoriter Anayasa'ya aykırı.",
          details: parsed.error.flatten(),
        },
      };
    }

    const result = await this.bus.dispatch(parsed.data);
    return {
      ok: true,
      result,
    };
  }
}
