import { randomBytes, randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  ADMIN_SESSION_SCHEMA_VERSION,
  validateAdminSessionRecordV1,
  type AdminSessionRecordV1,
} from "@santis/session-contracts";

import { hashSessionToken, type SessionStore } from "../persistence/session.store.js";

const SESSION_IDLE_SECONDS = 30 * 60;
const SESSION_ABSOLUTE_SECONDS = 8 * 60 * 60;
const LOGIN_BODY_KEYS = new Set(["email", "password"]);

interface LoginBody {
  email: string;
  password: string;
}

interface SupabaseTokenResponse {
  access_token?: unknown;
  user?: { id?: unknown };
}

interface SupabaseUserResponse {
  id?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLoginBody(value: unknown): LoginBody | null {
  if (!isRecord(value) || !Object.keys(value).every((key) => LOGIN_BODY_KEYS.has(key))) return null;
  if (typeof value.email !== "string" || value.email.length < 3 || value.email.length > 320) return null;
  if (typeof value.password !== "string" || value.password.length < 1 || value.password.length > 1024) return null;
  return { email: value.email, password: value.password };
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`ERR_MISSING_${name}`);
  return value;
}

function supabaseEndpoint(baseUrl: string, path: string): URL {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    throw new Error("ERR_INVALID_SUPABASE_URL");
  }
  if (base.protocol !== "https:") throw new Error("ERR_INVALID_SUPABASE_URL");
  return new URL(path, `${base.origin}/`);
}

async function proveSupabaseCredentials(body: LoginBody): Promise<string> {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const publishableKey = requiredEnv("SUPABASE_PUBLISHABLE_KEY");
  const loginUrl = supabaseEndpoint(supabaseUrl, "/auth/v1/token?grant_type=password");

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: body.email, password: body.password }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    throw new Error("ERR_IDENTITY_PROVIDER_UNAVAILABLE", { cause: error });
  }

  if (tokenResponse.status === 400 || tokenResponse.status === 401 || tokenResponse.status === 403) {
    throw new Error("ERR_INVALID_CREDENTIALS");
  }
  if (!tokenResponse.ok) throw new Error("ERR_IDENTITY_PROVIDER_UNAVAILABLE");

  const tokenPayload = (await tokenResponse.json()) as SupabaseTokenResponse;
  const accessToken = tokenPayload.access_token;
  const loginSubject = tokenPayload.user?.id;
  if (typeof accessToken !== "string" || accessToken.length === 0 || typeof loginSubject !== "string") {
    throw new Error("ERR_INVALID_IDENTITY_PROOF");
  }

  // The Supabase access token is transient identity evidence only. It is never returned or persisted.
  const userUrl = supabaseEndpoint(supabaseUrl, "/auth/v1/user");
  let userResponse: Response;
  try {
    userResponse = await fetch(userUrl, {
      method: "GET",
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    throw new Error("ERR_IDENTITY_PROVIDER_UNAVAILABLE", { cause: error });
  }
  if (!userResponse.ok) throw new Error("ERR_INVALID_IDENTITY_PROOF");

  const verifiedUser = (await userResponse.json()) as SupabaseUserResponse;
  if (typeof verifiedUser.id !== "string" || verifiedUser.id !== loginSubject) {
    throw new Error("ERR_INVALID_IDENTITY_PROOF");
  }
  return verifiedUser.id;
}

function generateOpaqueSessionToken(): string {
  const raw = randomBytes(32).toString("base64url");
  if (raw.length !== 43) throw new Error("ERR_SESSION_TOKEN_GENERATION");
  return raw;
}

export function createLoginHandler(store: SessionStore) {
  return async function loginHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = parseLoginBody(request.body);
    if (!body) {
      await reply.code(400).send({ error: "ERR_INVALID_LOGIN_REQUEST" });
      return;
    }

    let subjectId: string;
    try {
      subjectId = await proveSupabaseCredentials(body);
    } catch (error) {
      const code = error instanceof Error ? error.message : "ERR_INVALID_IDENTITY_PROOF";
      if (code === "ERR_INVALID_CREDENTIALS" || code === "ERR_INVALID_IDENTITY_PROOF") {
        await reply.code(401).send({ error: "ERR_AUTHENTICATION_FAILED" });
      } else {
        await reply.code(503).send({ error: "ERR_IDENTITY_PROVIDER_UNAVAILABLE" });
      }
      return;
    }

    let policy;
    try {
      policy = await store.getAdminPolicy(subjectId);
    } catch {
      await reply.code(503).send({ error: "ERR_AUTHORITY_STORE_UNAVAILABLE" });
      return;
    }
    if (!policy) {
      await reply.code(403).send({ error: "ERR_POLICY_UNAVAILABLE" });
      return;
    }

    const rawSessionToken = generateOpaqueSessionToken();
    const now = new Date();
    const idleExpiresAt = new Date(now.getTime() + SESSION_IDLE_SECONDS * 1_000);
    const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_SECONDS * 1_000);
    const record: AdminSessionRecordV1 = {
      schema_version: ADMIN_SESSION_SCHEMA_VERSION,
      session_id_hash: hashSessionToken(rawSessionToken),
      subject_id: subjectId,
      tenant_scope: [...policy.tenant_scope],
      location_scope: [...policy.location_scope],
      capability_set: [...policy.capability_set],
      authentication_level: "AAL1",
      issued_at: now.toISOString(),
      last_activity_at: now.toISOString(),
      expires_at: idleExpiresAt.toISOString(),
      absolute_expires_at: absoluteExpiresAt.toISOString(),
      session_state: "ACTIVE",
      revocation_state: "NOT_REVOKED",
      revoked_at: null,
      revocation_reason: null,
      session_version: 1,
      created_by_auth_event_id: `auth_evt_${randomUUID()}`,
      last_authorization_event_id: null,
    };

    const contract = validateAdminSessionRecordV1(record, {
      knownCapabilities: new Set(policy.capability_set),
    });
    if (!contract.ok) {
      await reply.code(500).send({ error: "ERR_SESSION_CONTRACT_INVALID" });
      return;
    }

    try {
      await store.saveSession(record, SESSION_IDLE_SECONDS);
    } catch {
      await reply.code(503).send({ error: "ERR_AUTHORITY_STORE_UNAVAILABLE" });
      return;
    }

    await reply.code(200).send({
      session_reference: rawSessionToken,
      subject_id: subjectId,
      expires_at: record.expires_at,
      absolute_expires_at: record.absolute_expires_at,
    });
  };
}
