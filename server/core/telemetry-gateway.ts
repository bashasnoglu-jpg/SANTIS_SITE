import { ZodError } from "zod";
import {
  parseSovereignEnvelope,
  type SovereignEnvelope,
} from "./telemetry.ts";
import {
  assertOriginAuthorized,
  getTelemetryPolicyForEnvelope,
} from "./event-dictionary.ts";

export type TelemetryRejectionCode =
  | "INVALID_JSON"
  | "SCHEMA_VIOLATION"
  | "AUTH_VIOLATION"
  | "UNKNOWN_REJECTION";

export class SovereignTelemetryError extends Error {
  public readonly code: TelemetryRejectionCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: TelemetryRejectionCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "SovereignTelemetryError";
    this.code = code;
    this.details = details;
  }
}

export interface TelemetryGatewayContext {
  channel: "WEBSOCKET" | "HTTP" | "EVENTBUS" | "PYTHON_BRIDGE" | "INTERNAL";
  remoteAddress?: string;
  userAgent?: string;
  sourceHint?: string;
}

export interface AcceptedTelemetryIngress {
  envelope: SovereignEnvelope;
  policy: ReturnType<typeof getTelemetryPolicyForEnvelope>;
  receivedAt: number;
  context: TelemetryGatewayContext;
}

export function ingestSovereignEnvelope(
  input: unknown,
  context: TelemetryGatewayContext
): AcceptedTelemetryIngress {
  try {
    const envelope = parseSovereignEnvelope(input);

    assertOriginAuthorized(envelope);

    const policy = getTelemetryPolicyForEnvelope(envelope);

    return {
      envelope,
      policy,
      receivedAt: Date.now(),
      context,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new SovereignTelemetryError(
        "SCHEMA_VIOLATION",
        "[SOVEREIGN_SCHEMA_VIOLATION] Envelope failed constitutional schema validation.",
        {
          channel: context.channel,
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            code: issue.code,
            message: issue.message,
          })),
        }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("SOVEREIGN_AUTH_VIOLATION")) {
        throw new SovereignTelemetryError(
          "AUTH_VIOLATION",
          error.message,
          {
            channel: context.channel,
          }
        );
      }

      throw new SovereignTelemetryError(
        "UNKNOWN_REJECTION",
        error.message,
        {
          channel: context.channel,
        }
      );
    }

    throw new SovereignTelemetryError(
      "UNKNOWN_REJECTION",
      "[SOVEREIGN_UNKNOWN_REJECTION] Unknown telemetry ingest failure.",
      {
        channel: context.channel,
      }
    );
  }
}

export function parseJsonUnknown(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new SovereignTelemetryError(
      "INVALID_JSON",
      "[SOVEREIGN_INVALID_JSON] Ingress payload is not valid JSON."
    );
  }
}
