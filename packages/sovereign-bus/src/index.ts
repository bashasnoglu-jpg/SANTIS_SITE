import type { SantisCommand, SantisEvent } from "@santis-core/event-contracts";
import type { CommandResult } from "@santis-core/event-contracts/command-result";

/**
 * ============================================================================
 * SOVEREIGN BUS v2
 * Event ve Command akışlarını fiziksel olarak ayıran, tip güvenli omurga.
 * Parse edilmemiş veri bu katmana giremez.
 * ============================================================================
 */

export type Unsubscribe = () => void;

export type EventType = SantisEvent["eventType"];
export type CommandType = SantisCommand["commandType"];

export type EventOfType<TType extends EventType> = Extract<
  SantisEvent,
  { eventType: TType }
>;

export type CommandOfType<TType extends CommandType> = Extract<
  SantisCommand,
  { commandType: TType }
>;

export type EventHandler<TType extends EventType> = (
  event: EventOfType<TType>
) => void | Promise<void>;

export type CommandHandler<TType extends CommandType> = (
  command: CommandOfType<TType>
) => Promise<CommandResult> | CommandResult;

export interface BusObserver {
  onEventPublished?(event: SantisEvent): void;
  onCommandDispatched?(command: SantisCommand): void;
  onEventHandlerError?(event: SantisEvent, error: unknown): void;
  onCommandHandlerError?(command: SantisCommand, error: unknown): void;
  onNoCommandHandler?(command: SantisCommand): void;
  onDuplicateCommandHandler?(commandType: CommandType): void;
}

export class SovereignBusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SovereignBusError";
  }
}

export class DuplicateCommandHandlerError extends SovereignBusError {
  constructor(commandType: CommandType) {
    super(`Duplicate command handler registration attempted for "${commandType}"`);
    this.name = "DuplicateCommandHandlerError";
  }
}

export class MissingCommandHandlerError extends SovereignBusError {
  constructor(commandType: CommandType) {
    super(`No command handler registered for "${commandType}"`);
    this.name = "MissingCommandHandlerError";
  }
}

function hasValidTraceId(value: { traceId?: string } | { traceId: string }): boolean {
  return typeof value.traceId === "string" && value.traceId.length > 0;
}

function freezeDev<T>(value: T): T {
  // İstersen bunu NODE_ENV'e bağlayabilirsin.
  return Object.freeze(value);
}

export class SovereignEventBus {
  private readonly handlers = new Map<EventType, Set<EventHandler<any>>>();
  private readonly observers = new Set<BusObserver>();

  addObserver(observer: BusObserver): Unsubscribe {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  subscribe<TType extends EventType>(
    eventType: TType,
    handler: EventHandler<TType>
  ): Unsubscribe {
    const existing = this.handlers.get(eventType) ?? new Set<EventHandler<TType>>();
    existing.add(handler);
    this.handlers.set(eventType, existing as Set<EventHandler<any>>);

    return () => {
      const current = this.handlers.get(eventType);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }

  async publish<TType extends EventType>(event: EventOfType<TType>): Promise<void> {
    if (!hasValidTraceId(event)) {
      throw new SovereignBusError(
        `Event "${event.eventType}" cannot be published without traceId`
      );
    }

    const frozen = freezeDev(event);
    for (const observer of this.observers) {
      observer.onEventPublished?.(frozen);
    }

    const subscribers = this.handlers.get(event.eventType);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    for (const handler of subscribers) {
      try {
        await handler(frozen);
      } catch (error) {
        for (const observer of this.observers) {
          observer.onEventHandlerError?.(frozen, error);
        }
        throw error;
      }
    }
  }
}

export class SovereignCommandBus {
  private readonly handlers = new Map<CommandType, CommandHandler<any>>();
  private readonly observers = new Set<BusObserver>();

  addObserver(observer: BusObserver): Unsubscribe {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  registerHandler<TType extends CommandType>(
    commandType: TType,
    handler: CommandHandler<TType>
  ): Unsubscribe {
    if (this.handlers.has(commandType)) {
      for (const observer of this.observers) {
        observer.onDuplicateCommandHandler?.(commandType);
      }
      throw new DuplicateCommandHandlerError(commandType);
    }

    this.handlers.set(commandType, handler as CommandHandler<any>);

    return () => {
      const current = this.handlers.get(commandType);
      if (current === handler) {
        this.handlers.delete(commandType);
      }
    };
  }

  async dispatch<TType extends CommandType>(
    command: CommandOfType<TType>
  ): Promise<CommandResult> {
    if (!hasValidTraceId(command as CommandOfType<TType> & { traceId?: string })) {
      return {
        status: "nack",
        commandId: command.commandId,
        traceId: (command as any).traceId || "no_trace_id",
        rejectedAt: new Date().toISOString(),
        reasonCode: "validation_failed",
        message: `Command "${command.commandType}" cannot be dispatched without traceId`,
        retryable: false,
      };
    }

    const frozen = freezeDev(command);
    for (const observer of this.observers) {
      observer.onCommandDispatched?.(frozen);
    }

    const handler = this.handlers.get(command.commandType);
    if (!handler) {
      for (const observer of this.observers) {
        observer.onNoCommandHandler?.(frozen);
      }
      return {
        status: "nack",
        commandId: command.commandId,
        traceId: (command as any).traceId,
        rejectedAt: new Date().toISOString(),
        reasonCode: "unknown_command",
        message: `No handler registered for "${command.commandType}"`,
        retryable: false,
      };
    }

    try {
      return await handler(frozen);
    } catch (error) {
      for (const observer of this.observers) {
        observer.onCommandHandlerError?.(frozen, error);
      }
      return {
        status: "nack",
        commandId: command.commandId,
        traceId: (command as any).traceId,
        rejectedAt: new Date().toISOString(),
        reasonCode: "handler_failed",
        message: error instanceof Error ? error.message : "Unhandled command handler error",
        retryable: true,
      };
    }
  }
}

export class SovereignBus {
  public readonly events: SovereignEventBus;
  public readonly commands: SovereignCommandBus;

  constructor() {
    this.events = new SovereignEventBus();
    this.commands = new SovereignCommandBus();
  }

  addObserver(observer: BusObserver): Unsubscribe {
    const removeEventObserver = this.events.addObserver(observer);
    const removeCommandObserver = this.commands.addObserver(observer);

    return () => {
      removeEventObserver();
      removeCommandObserver();
    };
  }
}
