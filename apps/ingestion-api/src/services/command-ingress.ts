import { SantisCommandSchema } from "@santis/event-dictionary";
import type { SovereignBus } from "@santis/sovereign-bus";
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
  constructor(private readonly bus: SovereignBus) {}

  async ingest(rawBody: unknown, overrideTraceId?: string, overrideSessionId?: string): Promise<CommandIngressResult> {
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

    const command = parsed.data;
    // Note: TraceId and SessionId are usually generated upstream if missing.
    // If not provided, the schema or bus validation will reject if they are truly required.
    const traceId = overrideTraceId || command.traceId || "fallback-trace-id";
    const sessionId = overrideSessionId || command.sessionId || "anonymous-session";
    
    const commandToDispatch = {
      ...command,
      traceId,
      sessionId
    };

    const result = await this.bus.commands.dispatch(commandToDispatch);
    return {
      ok: true,
      result,
    };
  }
}
