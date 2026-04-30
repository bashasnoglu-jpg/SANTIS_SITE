import { SantisCommandSchema } from "@santis/event-dictionary";
import type { SovereignCommandBus } from "@santis/sovereign-bus";
import type { CommandResult } from "@santis/event-dictionary/command-result";

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
