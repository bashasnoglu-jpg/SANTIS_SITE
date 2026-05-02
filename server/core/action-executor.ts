import { randomUUID } from "node:crypto";

import { ConstitutionalGuard } from "./adapter.ts";
import {
  MessageOrigin,
  MessageType,
  SOVEREIGN_SCHEMA_VERSION,
  SovereignSubject,
  type SovereignEventEnvelope,
} from "./telemetry.ts";
import { ingestSovereignEnvelope } from "./telemetry-gateway.ts";
import { appendEvent as telemetryRepoAppendEvent } from "../repositories/telemetry-repository.js";
import { upsertVisitor as visitorRepoUpsertVisitor } from "../repositories/visitor-repository.js";

const telemetryRepo = { appendEvent: telemetryRepoAppendEvent };
const visitorRepo = { upsertVisitor: visitorRepoUpsertVisitor };

type DeliveryPaths = {
  hero?: string;
  card?: string;
  thumb?: string;
};

export interface UploadFinalizeBindingInput {
  uploadId?: string;
  assetId: string;
  publicId: string;
  tenantId: string;
  checksumSha256?: string | null;
  byteSize?: number | null;
  mimeType?: string | null;
  filename?: string | null;
  storageKey?: string | null;
  delivery?: DeliveryPaths | null;
}

export interface ActionExecutionResult {
  success: boolean;
  eventId?: string;
  reason?: string;
  message?: string;
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toOptionalInteger = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.round(value);
};

function buildResourceSealedEnvelope(
  input: UploadFinalizeBindingInput
): SovereignEventEnvelope {
  return {
    id: randomUUID(),
    type: MessageType.EVENT,
    tracking: {
      correlationId: randomUUID(),
      causationId: randomUUID(),
    },
    payload: {
      timestamp: Date.now(),
      version: SOVEREIGN_SCHEMA_VERSION,
      origin: MessageOrigin.NODE_ORCHESTRATOR,
      subject: SovereignSubject.SYSTEM_INTEGRITY,
      action: "RESOURCE_SEALED",
      tenantId: input.tenantId,
      assetId: input.assetId,
      publicId: input.publicId,
      uploadId: toOptionalString(input.uploadId),
      checksumSha256: toOptionalString(input.checksumSha256 ?? undefined),
      byteSize: toOptionalInteger(input.byteSize ?? undefined),
      mimeType: toOptionalString(input.mimeType ?? undefined),
      filename: toOptionalString(input.filename ?? undefined),
      storageKey: toOptionalString(input.storageKey ?? undefined),
      deliveryCard: toOptionalString(input.delivery?.card),
      deliveryHero: toOptionalString(input.delivery?.hero),
      deliveryThumb: toOptionalString(input.delivery?.thumb),
    },
  };
}

function buildTelemetryEvent(
  envelope: SovereignEventEnvelope,
  input: UploadFinalizeBindingInput
) {
  const visitorId = `system:${input.tenantId}`;
  const sessionId =
    toOptionalString(input.uploadId) ??
    `asset:${input.assetId}`;

  return {
    type: "upload.resource.sealed",
    visitorId,
    sessionId,
    page: "/api/v1/uploads/finalize",
    source: "orbital-forge",
    data: {
      envelopeId: envelope.id,
      envelopeType: envelope.type,
      origin: envelope.payload.origin,
      subject: envelope.payload.subject,
      action: envelope.payload.action,
      assetId: input.assetId,
      publicId: input.publicId,
      tenantId: input.tenantId,
      checksumSha256: toOptionalString(input.checksumSha256 ?? undefined) ?? null,
      byteSize: toOptionalInteger(input.byteSize ?? undefined) ?? null,
      mimeType: toOptionalString(input.mimeType ?? undefined) ?? null,
      filename: toOptionalString(input.filename ?? undefined) ?? null,
      storageKey: toOptionalString(input.storageKey ?? undefined) ?? null,
      delivery: input.delivery ?? null,
    },
    timestamp: new Date(envelope.payload.timestamp).toISOString(),
  };
}

export const ActionExecutor = {
  async handleUploadFinalize(
    uploadData: UploadFinalizeBindingInput
  ): Promise<ActionExecutionResult> {
    try {
      const candidateEnvelope = buildResourceSealedEnvelope(uploadData);
      const envelope = ConstitutionalGuard.sanitize(candidateEnvelope);

      if (!envelope || envelope.type !== MessageType.EVENT) {
        console.error(
          "[ACTION_EXECUTOR]: Illegal upload finalize payload rejected."
        );
        return {
          success: false,
          reason: "CONSTITUTIONAL_VIOLATION",
          message: "Upload finalize payload could not be sealed into a valid envelope.",
        };
      }

      ingestSovereignEnvelope(envelope, {
        channel: "INTERNAL",
        sourceHint: "orbital-forge/finalize",
      });

      const telemetryEvent = buildTelemetryEvent(envelope, uploadData);
      await visitorRepo.upsertVisitor(telemetryEvent.visitorId);
      await telemetryRepo.appendEvent(telemetryEvent);

      console.log(
        `[ACTION_EXECUTOR]: Resource ${uploadData.assetId} sealed with checksum ${uploadData.checksumSha256 ?? "UNDECLARED"} -> envelope ${envelope.id}`
      );

      return {
        success: true,
        eventId: envelope.id,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown_action_executor_error";
      console.error("[ACTION_EXECUTOR]: Upload finalize binding failed.", error);
      return {
        success: false,
        reason: "ACTION_EXECUTOR_FAILURE",
        message,
      };
    }
  },
};
