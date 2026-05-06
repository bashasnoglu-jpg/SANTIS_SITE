import crypto from "crypto";
import type { SovereignBus, CommandOfType } from "@santis/sovereign-bus";
import type { CommandResult } from "@santis/event-dictionary/command-result";
import type { SseManager } from "../services/sse-manager.js";
import {
  buildPriceAdjustmentStrategyKey,
  strategyLearningStore,
} from "../revenue/strategy-learning.store.js";

function ack(command: { commandId: string; traceId?: string }): CommandResult {
  return {
    status: "ack",
    commandId: command.commandId,
    traceId: command.traceId || "no-trace-id",
    acceptedAt: new Date().toISOString(),
    mode: "sync_completed",
    resultingEventTypes: [],
  };
}

function createSystemIntent() {
  return {
    guestId: "system",
    isReturningGuest: true,
    segment: "vip" as const,
    moodAffinity: [],
    premiumThreshold: 100,
  };
}

function createSystemTenant() {
  return {
    hotelId: "system",
    hotelCode: "SYS",
    region: "EU" as const,
    locale: "en" as const,
    currency: "EUR" as const,
    activePolicies: [],
    fallbackMode: false,
  };
}

export function registerCommandHandlers(bus: SovereignBus, sseManager: SseManager): void {
  bus.commands.registerHandler("commerce.record_checkout", async (command: CommandOfType<"commerce.record_checkout">) => {
    await bus.events.publish({
      eventId: crypto.randomUUID(),
      eventType: "commerce.checkout.completed",
      occurredAt: new Date().toISOString(),
      tenant: command.tenant,
      intent: {
        ...createSystemIntent(),
        guestId: command.payload.guestId,
      },
      traceId: command.traceId,
      sessionId: command.sessionId,
      schemaVersion: "v1",
      payload: command.payload,
    });

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
      tenant: createSystemTenant(),
      intent: createSystemIntent(),
      payload: {
        recommendationId: command.payload.recommendationId,
        decision: command.payload.decision,
        finalAction: command.payload.decision,
        appliedDeltaPct: command.payload.appliedDeltaPct || 0,
        operatorId: command.payload.operatorId || "system",
      },
    });

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
      tenant: command.tenant || createSystemTenant(),
      intent: createSystemIntent(),
      payload: {
        actionId: command.payload.actionId,
        sourceEventId: command.payload.sourceEventId,
        actionType: command.payload.actionType,
        operatorId: command.payload.operatorId,
        accepted: true,
        executedAt: new Date().toISOString(),
        metadata: command.payload.metadata,
      },
    });

    return ack(command);
  });

  bus.commands.registerHandler("boardroom.strategy.apply", async (command: CommandOfType<"boardroom.strategy.apply">) => {
    const operatorContext = {
      ...command.payload.operatorContext,
      operatorId: command.payload.operatorContext.operatorId || "boardroom-operator",
    };
    const strategyKey = buildPriceAdjustmentStrategyKey(command.payload.strategy.deltaPct);

    await strategyLearningStore.recordOperatorDecision({
      strategyId: command.payload.recommendationId,
      variantId: command.payload.recommendationId,
      strategyKey,
      segment: command.tenant?.hotelCode || "default",
      decision: command.payload.decision,
    });

    await bus.events.publish({
      eventId: crypto.randomUUID(),
      eventType: "boardroom.strategy.applied",
      occurredAt: new Date().toISOString(),
      traceId: command.traceId,
      sessionId: command.sessionId,
      schemaVersion: "v1",
      tenant: command.tenant || createSystemTenant(),
      intent: createSystemIntent(),
      payload: {
        recommendationId: command.payload.recommendationId,
        sessionId: command.payload.sessionId,
        strategy: command.payload.strategy,
        decision: command.payload.decision,
        operatorContext,
        meta: command.payload.meta,
        appliedAt: new Date().toISOString(),
      },
    });

    return ack(command);
  });
  
  bus.commands.registerHandler("boardroom.override.apply", async (command: CommandOfType<"boardroom.override.apply">) => {
    const operatorId = command.payload.operatorId || "boardroom-operator";
    
    await bus.events.publish({
      eventId: crypto.randomUUID(),
      eventType: "boardroom.override.applied",
      occurredAt: new Date().toISOString(),
      traceId: command.traceId,
      sessionId: command.sessionId,
      schemaVersion: "v1",
      tenant: command.tenant || createSystemTenant(),
      intent: createSystemIntent(),
      payload: {
        action: command.payload.action,
        reason: command.payload.reason,
        operatorId,
        appliedAt: new Date().toISOString(),
        meta: command.payload.meta,
      },
    });

    // Broadcast ACK via SSE for real-time feedback
    sseManager.broadcastPatch("command", {
      commandId: command.commandId,
      action: command.payload.action,
      status: "executed"
    }, "command_ack");

    return ack(command);
  });
}
