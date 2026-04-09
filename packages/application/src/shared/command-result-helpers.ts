import type {
  CommandAck,
  CommandNack,
} from "@santis/event-dictionary/command-result";

export function ack(params: {
  commandId: string;
  traceId: string;
  mode: "sync_completed" | "accepted_for_async_processing";
  message?: string;
  commandType: string;
  resultingEventTypes?: string[];
  resultingEventIds?: string[];
}): CommandAck {
  return {
    status: "ack",
    commandId: params.commandId,
    traceId: params.traceId,
    acceptedAt: new Date().toISOString(),
    mode: params.mode,
    message: params.message,
    resultingEventTypes: params.resultingEventTypes ?? [],
    correlation: {
      commandType: params.commandType,
      resultingEventIds: params.resultingEventIds ?? [],
    },
  };
}

export function nack(params: {
  commandId: string;
  traceId: string;
  reasonCode:
    | "validation_failed"
    | "unauthorized"
    | "forbidden"
    | "conflict"
    | "not_found"
    | "rate_limited"
    | "handler_failed"
    | "unknown_command"
    | "system_unavailable";
  message: string;
  retryable: boolean;
}): CommandNack {
  return {
    status: "nack",
    commandId: params.commandId,
    traceId: params.traceId,
    rejectedAt: new Date().toISOString(),
    reasonCode: params.reasonCode,
    message: params.message,
    retryable: params.retryable,
  };
}
