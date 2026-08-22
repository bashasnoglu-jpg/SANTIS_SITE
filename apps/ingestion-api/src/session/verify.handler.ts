import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  AUTHORIZATION_DECISION_SCHEMA_VERSION,
  AUTHORIZATION_REQUEST_SCHEMA_VERSION,
  validateAdminSessionRecordV1,
  validateAuthorizationDecisionV1,
  validateAuthorizationRequestV1,
  type AdminSessionRecordV1,
  type AuthorizationDecisionV1,
  type AuthorizationDenyCode,
  type AuthorizationRequestV1,
} from "@santis/session-contracts";

import type { AdminPolicyRecord, SessionStore } from "../persistence/session.store.js";

const POLICY_VERSION = "redis-admin-policy-v1";
const SESSION_IDLE_SECONDS = 30 * 60;
const REQUEST_BODY_KEYS = new Set([
  "request_id",
  "requested_resource",
  "requested_action",
  "requested_tenant_id",
  "requested_location_id",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sessionReference(request: FastifyRequest): string | null {
  const value = request.headers["x-santis-session"];
  return typeof value === "string" ? value : null;
}

function buildAuthorizationRequest(
  request: FastifyRequest,
  rawSessionToken: string,
): AuthorizationRequestV1 | null {
  const body = request.body;
  if (!isRecord(body) || !Object.keys(body).every((key) => REQUEST_BODY_KEYS.has(key))) return null;
  const candidate: AuthorizationRequestV1 = {
    schema_version: AUTHORIZATION_REQUEST_SCHEMA_VERSION,
    request_id: typeof body.request_id === "string" ? body.request_id : "",
    session_reference: rawSessionToken,
    requested_resource: typeof body.requested_resource === "string" ? body.requested_resource : "",
    requested_action: typeof body.requested_action === "string" ? body.requested_action : "",
    ...(typeof body.requested_tenant_id === "string"
      ? { requested_tenant_id: body.requested_tenant_id }
      : {}),
    ...(typeof body.requested_location_id === "string"
      ? { requested_location_id: body.requested_location_id }
      : {}),
  };
  const validated = validateAuthorizationRequestV1(candidate);
  return validated.ok ? validated.value : null;
}

function makeDecision(
  requestId: string,
  decision: "ALLOW" | "DENY",
  options: { subjectId?: string; denyCode?: AuthorizationDenyCode } = {},
): AuthorizationDecisionV1 {
  const authorizationEventId = `authz_evt_${randomUUID()}`;
  const result: AuthorizationDecisionV1 = decision === "ALLOW"
    ? {
        schema_version: AUTHORIZATION_DECISION_SCHEMA_VERSION,
        request_id: requestId,
        decision: "ALLOW",
        subject_id: options.subjectId ?? "",
        policy_version: POLICY_VERSION,
        authorization_event_id: authorizationEventId,
      }
    : {
        schema_version: AUTHORIZATION_DECISION_SCHEMA_VERSION,
        request_id: requestId,
        decision: "DENY",
        deny_code: options.denyCode ?? "RESOURCE_POLICY_DENIED",
        policy_version: POLICY_VERSION,
        authorization_event_id: authorizationEventId,
      };

  const validated = validateAuthorizationDecisionV1(result);
  if (!validated.ok) throw new Error("ERR_AUTHORIZATION_DECISION_CONTRACT");
  return validated.value;
}

async function sendDeny(
  reply: FastifyReply,
  requestId: string,
  denyCode: AuthorizationDenyCode,
  statusCode: number,
): Promise<void> {
  await reply.code(statusCode).send(makeDecision(requestId, "DENY", { denyCode }));
}

function policyContainsSession(policy: AdminPolicyRecord, session: AdminSessionRecordV1): boolean {
  const tenant = new Set(policy.tenant_scope);
  const location = new Set(policy.location_scope);
  const capability = new Set(policy.capability_set);
  return (
    session.tenant_scope.every((value) => tenant.has(value)) &&
    session.location_scope.every((value) => location.has(value)) &&
    session.capability_set.every((value) => capability.has(value))
  );
}

function requiredCapability(request: AuthorizationRequestV1): string | null {
  const resourceClass = request.requested_resource.split(":", 1)[0]
    ?.toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!resourceClass) return null;
  const capability = `${resourceClass}_${request.requested_action}`;
  return /^[A-Z][A-Z0-9_]{2,63}$/.test(capability) ? capability : null;
}

function preliminarySubject(candidate: unknown): string | null {
  if (!isRecord(candidate)) return null;
  return typeof candidate.subject_id === "string" && candidate.subject_id.length >= 1 && candidate.subject_id.length <= 128
    ? candidate.subject_id
    : null;
}

export function createVerifyHandler(store: SessionStore) {
  return async function verifyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const rawSessionToken = sessionReference(request);
    const fallbackRequestId = isRecord(request.body) && typeof request.body.request_id === "string"
      ? request.body.request_id
      : "unknown-request";
    if (!rawSessionToken) {
      await sendDeny(reply, fallbackRequestId, "NO_SESSION", 401);
      return;
    }

    const authorizationRequest = buildAuthorizationRequest(request, rawSessionToken);
    if (!authorizationRequest || !authorizationRequest.requested_tenant_id) {
      await sendDeny(reply, fallbackRequestId, "CONTRACT_INVALID", 403);
      return;
    }

    let candidate: unknown;
    try {
      candidate = await store.getSessionByReference(rawSessionToken);
    } catch (error) {
      if (error instanceof Error && error.message === "ERR_INVALID_SESSION_REFERENCE") {
        await sendDeny(reply, authorizationRequest.request_id, "INVALID_SESSION", 401);
      } else {
        await sendDeny(reply, authorizationRequest.request_id, "AUTHORITY_STORE_UNAVAILABLE", 503);
      }
      return;
    }
    if (candidate === null) {
      await sendDeny(reply, authorizationRequest.request_id, "SESSION_NOT_FOUND", 401);
      return;
    }

    const subjectId = preliminarySubject(candidate);
    if (!subjectId) {
      await sendDeny(reply, authorizationRequest.request_id, "INVALID_SESSION", 401);
      return;
    }

    let policy: AdminPolicyRecord | null;
    try {
      policy = await store.getAdminPolicy(subjectId);
    } catch {
      await sendDeny(reply, authorizationRequest.request_id, "AUTHORITY_STORE_UNAVAILABLE", 503);
      return;
    }
    if (!policy) {
      await sendDeny(reply, authorizationRequest.request_id, "POLICY_UNAVAILABLE", 403);
      return;
    }

    const sessionValidation = validateAdminSessionRecordV1(candidate, {
      knownCapabilities: new Set(policy.capability_set),
    });
    if (!sessionValidation.ok) {
      await sendDeny(reply, authorizationRequest.request_id, "INVALID_SESSION", 401);
      return;
    }
    const session = sessionValidation.value;

    if (session.revocation_state === "REVOKED" || session.session_state === "REVOKED") {
      await sendDeny(reply, authorizationRequest.request_id, "SESSION_REVOKED", 401);
      return;
    }

    const now = new Date();
    const idleExpiry = Date.parse(session.expires_at);
    const absoluteExpiry = Date.parse(session.absolute_expires_at);
    if (
      session.session_state !== "ACTIVE" ||
      !Number.isFinite(idleExpiry) ||
      !Number.isFinite(absoluteExpiry) ||
      now.getTime() >= idleExpiry ||
      now.getTime() >= absoluteExpiry
    ) {
      await sendDeny(reply, authorizationRequest.request_id, "SESSION_EXPIRED", 401);
      return;
    }

    if (!policyContainsSession(policy, session)) {
      try {
        await store.revokeSession(rawSessionToken, "ROLE_CHANGED", now);
      } catch {
        await sendDeny(reply, authorizationRequest.request_id, "AUTHORITY_STORE_UNAVAILABLE", 503);
        return;
      }
      await sendDeny(reply, authorizationRequest.request_id, "RESOURCE_POLICY_DENIED", 403);
      return;
    }

    if (!session.tenant_scope.includes(authorizationRequest.requested_tenant_id)) {
      await sendDeny(reply, authorizationRequest.request_id, "TENANT_SCOPE_MISMATCH", 403);
      return;
    }
    if (
      authorizationRequest.requested_location_id &&
      !session.location_scope.includes(authorizationRequest.requested_location_id)
    ) {
      await sendDeny(reply, authorizationRequest.request_id, "LOCATION_SCOPE_MISMATCH", 403);
      return;
    }

    const capability = requiredCapability(authorizationRequest);
    if (!capability || !session.capability_set.includes(capability) || !policy.capability_set.includes(capability)) {
      await sendDeny(reply, authorizationRequest.request_id, "CAPABILITY_DENIED", 403);
      return;
    }

    const newIdleExpiry = Math.min(now.getTime() + SESSION_IDLE_SECONDS * 1_000, absoluteExpiry);
    const authorizationEventId = `authz_evt_${randomUUID()}`;
    const refreshed: AdminSessionRecordV1 = {
      ...session,
      last_activity_at: now.toISOString(),
      expires_at: new Date(newIdleExpiry).toISOString(),
      last_authorization_event_id: authorizationEventId,
    };
    const ttlSeconds = Math.max(1, Math.ceil((newIdleExpiry - now.getTime()) / 1_000));
    try {
      await store.saveSession(refreshed, ttlSeconds);
    } catch {
      await sendDeny(reply, authorizationRequest.request_id, "AUTHORITY_STORE_UNAVAILABLE", 503);
      return;
    }

    const decision: AuthorizationDecisionV1 = {
      schema_version: AUTHORIZATION_DECISION_SCHEMA_VERSION,
      request_id: authorizationRequest.request_id,
      decision: "ALLOW",
      subject_id: session.subject_id,
      policy_version: POLICY_VERSION,
      authorization_event_id: authorizationEventId,
    };
    const validatedDecision = validateAuthorizationDecisionV1(decision);
    if (!validatedDecision.ok) {
      await sendDeny(reply, authorizationRequest.request_id, "CONTRACT_INVALID", 500);
      return;
    }
    await reply.code(200).send(validatedDecision.value);
  };
}
