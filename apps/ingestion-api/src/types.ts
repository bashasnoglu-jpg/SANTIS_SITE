import { Request } from "express";
import { SessionTokenPayload } from "./security/crypto-token";

export interface SessionRequest extends Request {
  session?: SessionTokenPayload;
}

export type EventPayloadRecord = Record<string, unknown>;

export interface SantisEventEnvelope {
  eventType?: string;
  type?: string;
  payload?: EventPayloadRecord;
  occurredAt?: string;
  traceId?: string;
  [key: string]: unknown;
}
