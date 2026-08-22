import type { FastifyReply, FastifyRequest } from "fastify";
import { validateAdminSessionRecordV1, type AdminSessionRecordV1 } from "@santis/session-contracts";

import type { AdminPolicyRecord, SessionStore } from "../persistence/session.store.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rawSessionReference(request: FastifyRequest): string | null {
  const value = request.headers["x-santis-session"];
  return typeof value === "string" ? value : null;
}

function policyContainsSession(policy: AdminPolicyRecord, session: AdminSessionRecordV1): boolean {
  const tenants = new Set(policy.tenant_scope);
  const locations = new Set(policy.location_scope);
  const capabilities = new Set(policy.capability_set);
  return (
    session.tenant_scope.every((value) => tenants.has(value)) &&
    session.location_scope.every((value) => locations.has(value)) &&
    session.capability_set.every((value) => capabilities.has(value))
  );
}

export function createLogoutHandler(store: SessionStore) {
  return async function logoutHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const raw = rawSessionReference(request);
    if (!raw) {
      await reply.code(401).send({ error: "ERR_NO_SESSION" });
      return;
    }

    let candidate: unknown;
    try {
      candidate = await store.getSessionByReference(raw);
    } catch {
      await reply.code(401).send({ error: "ERR_INVALID_SESSION" });
      return;
    }
    if (!isRecord(candidate) || typeof candidate.subject_id !== "string") {
      await reply.code(401).send({ error: "ERR_INVALID_SESSION" });
      return;
    }

    let policy: AdminPolicyRecord | null;
    try {
      policy = await store.getAdminPolicy(candidate.subject_id);
    } catch {
      await reply.code(503).send({ error: "ERR_AUTHORITY_STORE_UNAVAILABLE" });
      return;
    }
    if (!policy) {
      await reply.code(403).send({ error: "ERR_POLICY_UNAVAILABLE" });
      return;
    }

    const validation = validateAdminSessionRecordV1(candidate, {
      knownCapabilities: new Set(policy.capability_set),
    });
    if (!validation.ok) {
      await reply.code(401).send({ error: "ERR_INVALID_SESSION" });
      return;
    }

    const session = validation.value;
    const now = Date.now();
    if (
      session.session_state !== "ACTIVE" ||
      session.revocation_state !== "NOT_REVOKED" ||
      now >= Date.parse(session.expires_at) ||
      now >= Date.parse(session.absolute_expires_at) ||
      !policyContainsSession(policy, session)
    ) {
      await reply.code(401).send({ error: "ERR_INVALID_SESSION" });
      return;
    }

    try {
      const revoked = await store.revokeSession(raw, "USER_LOGOUT");
      if (!revoked) {
        await reply.code(401).send({ error: "ERR_INVALID_SESSION" });
        return;
      }
    } catch {
      await reply.code(503).send({ error: "ERR_AUTHORITY_STORE_UNAVAILABLE" });
      return;
    }

    await reply.code(204).send();
  };
}
