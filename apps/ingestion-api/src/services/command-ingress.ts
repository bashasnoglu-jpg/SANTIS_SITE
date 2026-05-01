import { SantisCommandSchema } from "@santis/event-dictionary";
import type { SovereignBus } from "@santis/sovereign-bus";
import type { CommandResult } from "@santis/event-dictionary/command-result";
import crypto from "crypto";

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
    const traceId = overrideTraceId || command.traceId || crypto.randomUUID();
    const sessionId = overrideSessionId || command.sessionId || "anonymous-session";
    
    const commandToDispatch = {
      ...command,
      traceId,
      sessionId
    };

    switch (commandToDispatch.commandType) {
      case "commerce.record_checkout":
        // Command -> Event Dönüşümü
        await this.bus.events.publish({
          eventId: crypto.randomUUID(),
          eventType: "commerce.checkout.completed",
          occurredAt: new Date().toISOString(),
          tenant: commandToDispatch.tenant,
          intent: {
            guestId: commandToDispatch.payload.guestId,
            isReturningGuest: true,
            segment: "vip",
            moodAffinity: [],
            premiumThreshold: 100
          },
          traceId: commandToDispatch.traceId,
          sessionId: commandToDispatch.sessionId,
          schemaVersion: "v1",
          payload: commandToDispatch.payload
        } as any);

        return {
          ok: true,
          result: {
            status: "ack",
            commandId: commandToDispatch.commandId,
            traceId: commandToDispatch.traceId,
            processedAt: new Date().toISOString(),
          }
        };

      case "pricing.override.apply":
        // Command -> Event Dönüşümü
        await this.bus.events.publish({
          eventId: crypto.randomUUID(),
          eventType: "pricing.override.applied",
          occurredAt: new Date().toISOString(),
          traceId: commandToDispatch.traceId,
          sessionId: commandToDispatch.sessionId,
          schemaVersion: "v1",
          tenant: { hotelId: "system", hotelCode: "SYS", region: "GLOBAL", locale: "en", currency: "EUR", activePolicies: [], fallbackMode: false },
          intent: { guestId: "system", isReturningGuest: true, segment: "vip", moodAffinity: [], premiumThreshold: 100 },
          payload: {
            recommendationId: commandToDispatch.payload?.recommendationId,
            decision: commandToDispatch.payload?.decision,
            appliedDeltaPct: commandToDispatch.payload?.appliedDeltaPct || 0,
            operatorId: commandToDispatch.payload?.operatorId || "system"
          }
        } as any);

        return {
          ok: true,
          result: {
            status: "ack",
            commandId: commandToDispatch.commandId,
            traceId: commandToDispatch.traceId,
            processedAt: new Date().toISOString(),
          }
        };
    }

    const result = await this.bus.commands.dispatch(commandToDispatch);
    return {
      ok: true,
      result,
    };
  }
}
