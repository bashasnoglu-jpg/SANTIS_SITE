import crypto from "crypto";
import type { SovereignBus, CommandOfType } from "@santis/sovereign-bus";
import type { CommandResult } from "@santis/event-dictionary/command-result";

function ack(command: { commandId: string; traceId?: string }): CommandResult {
  return {
    status: "ack",
    commandId: command.commandId,
    traceId: command.traceId || "no-trace-id",
    processedAt: new Date().toISOString(),
  };
}

export function registerCommandHandlers(bus: SovereignBus): void {
  bus.commands.registerHandler("commerce.record_checkout", async (command: CommandOfType<"commerce.record_checkout">) => {
    await bus.events.publish({
      eventId: crypto.randomUUID(),
      eventType: "commerce.checkout.completed",
      occurredAt: new Date().toISOString(),
      tenant: command.tenant,
      intent: {
        guestId: command.payload.guestId,
        isReturningGuest: true,
        segment: "vip",
        moodAffinity: [],
        premiumThreshold: 100,
      },
      traceId: command.traceId,
      sessionId: command.sessionId,
      schemaVersion: "v1",
      payload: command.payload,
    } as any);

    return ack(command);
  });

  bus.commands.registerHandler("pricing.override.apply", async (command: CommandOfType<"pricing.override.apply">) => {
    await bus.events.publish({
      eventId: crypto.randomUUID(),
      eventType: "pricing.override.applied",
      occurredAt: new Date().toISOString(),
      traceId: command.traceId,
      sessionId: command.sessionId,
      schemaVersion: "v1",
      tenant: {
        hotelId: "system",
        hotelCode: "SYS",
        region: "GLOBAL",
        locale: "en",
        currency: "EUR",
        activePolicies: [],
        fallbackMode: false,
      },
      intent: {
        guestId: "system",
        isReturningGuest: true,
        segment: "vip",
        moodAffinity: [],
        premiumThreshold: 100,
      },
      payload: {
        recommendationId: command.payload.recommendationId,
        decision: command.payload.decision,
        appliedDeltaPct: command.payload.appliedDeltaPct || 0,
        operatorId: command.payload.operatorId || "system",
      },
    } as any);

    return ack(command);
  });
  bus.commands.registerHandler("boardroom.oracle.execute", async (command: CommandOfType<"boardroom.oracle.execute">) => {
    await bus.events.publish({
      eventId: crypto.randomUUID(),
      eventType: "boardroom.oracle.executed",
      occurredAt: new Date().toISOString(),
      traceId: command.traceId,
      sessionId: command.sessionId,
      schemaVersion: "v1",
      tenant: command.tenant || {
        hotelId: "system",
        hotelCode: "SYS",
        region: "GLOBAL",
        locale: "en",
        currency: "EUR",
        activePolicies: [],
        fallbackMode: false,
      },
      intent: {
        guestId: "system",
        isReturningGuest: true,
        segment: "vip",
        moodAffinity: [],
        premiumThreshold: 100,
      },
      payload: {
        actionId: command.payload.actionId,
        sourceEventId: command.payload.sourceEventId,
        actionType: command.payload.actionType,
        operatorId: command.payload.operatorId,
        accepted: true,
        executedAt: new Date().toISOString(),
        metadata: command.payload.metadata,
      },
    } as any);

    return ack(command);
  });
}
