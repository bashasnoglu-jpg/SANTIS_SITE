import {
  ADMIN_SESSION_SCHEMA_VERSION,
  AUTHENTICATION_LEVELS,
  REVOCATION_REASONS,
  REVOCATION_STATES,
  SESSION_STATES,
  type AdminSessionRecordV1,
} from "./admin-session-record.v1.js";
import {
  AUTHORIZATION_REQUEST_SCHEMA_VERSION,
  type AuthorizationRequestV1,
} from "./authorization-request.v1.js";
import {
  AUTHORIZATION_DECISION_SCHEMA_VERSION,
  AUTHORIZATION_DENY_CODES,
  type AuthorizationDecisionV1,
} from "./authorization-decision.v1.js";

export interface ContractValidationError {
  path: string;
  code: string;
  message: string;
}

export type ContractValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ContractValidationError[] };

export interface AdminSessionValidationOptions {
  /** Canonical capability registry supplied by the trusted server caller. */
  knownCapabilities: ReadonlySet<string>;
}

const SESSION_KEYS = new Set([
  "schema_version",
  "session_id_hash",
  "subject_id",
  "tenant_scope",
  "location_scope",
  "capability_set",
  "authentication_level",
  "issued_at",
  "last_activity_at",
  "expires_at",
  "absolute_expires_at",
  "session_state",
  "revocation_state",
  "revoked_at",
  "revocation_reason",
  "session_version",
  "created_by_auth_event_id",
  "last_authorization_event_id",
]);

const AUTH_REQUEST_KEYS = new Set([
  "schema_version",
  "request_id",
  "session_reference",
  "requested_resource",
  "requested_action",
  "requested_tenant_id",
  "requested_location_id",
]);

const ALLOW_DECISION_KEYS = new Set([
  "schema_version",
  "request_id",
  "decision",
  "subject_id",
  "policy_version",
  "authorization_event_id",
]);

const DENY_DECISION_KEYS = new Set([
  "schema_version",
  "request_id",
  "decision",
  "deny_code",
  "policy_version",
  "authorization_event_id",
]);

const CAPABILITY_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/;
const ACTION_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;
const SESSION_HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
const OPAQUE_SESSION_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const FORBIDDEN_CAPABILITIES = new Set(["*", "ALL", "ADMIN_ALL"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function nonEmptyString(value: unknown, maxLength = 128): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= maxLength;
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function uniqueStrings(
  value: unknown,
  { minItems = 0, maxLength = 128, forbidWildcard = true }: {
    minItems?: number;
    maxLength?: number;
    forbidWildcard?: boolean;
  } = {},
): value is string[] {
  if (!Array.isArray(value) || value.length < minItems) return false;
  if (!value.every((item) => nonEmptyString(item, maxLength))) return false;
  if (new Set(value).size !== value.length) return false;
  if (forbidWildcard && value.includes("*")) return false;
  return true;
}

function push(
  errors: ContractValidationError[],
  path: string,
  code: string,
  message: string,
): void {
  errors.push({ path, code, message });
}

function validateTimestampOrder(record: Record<string, unknown>, errors: ContractValidationError[]): void {
  const keys = ["issued_at", "last_activity_at", "expires_at", "absolute_expires_at"] as const;
  if (!keys.every((key) => isIsoDateTime(record[key]))) return;

  const values = keys.map((key) => Date.parse(record[key] as string));
  if (!(values[0] <= values[1] && values[1] <= values[2] && values[2] <= values[3])) {
    push(
      errors,
      "$",
      "INVALID_TIMESTAMP_RELATIONSHIP",
      "Expected issued_at <= last_activity_at <= expires_at <= absolute_expires_at.",
    );
  }
}

export function validateAdminSessionRecordV1(
  input: unknown,
  options: AdminSessionValidationOptions,
): ContractValidationResult<AdminSessionRecordV1> {
  const errors: ContractValidationError[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: [{ path: "$", code: "TYPE_MISMATCH", message: "Expected object." }] };
  }

  if (!hasOnlyKeys(input, SESSION_KEYS)) {
    push(errors, "$", "UNKNOWN_FIELD", "Session record contains an unknown field.");
  }

  if (input.schema_version !== ADMIN_SESSION_SCHEMA_VERSION) {
    push(errors, "$.schema_version", "UNKNOWN_ENUM", "Unsupported schema version.");
  }
  if (typeof input.session_id_hash !== "string" || !SESSION_HASH_PATTERN.test(input.session_id_hash)) {
    push(errors, "$.session_id_hash", "TYPE_MISMATCH", "Expected sha256:<64 lowercase hex chars>.");
  }
  if (!nonEmptyString(input.subject_id)) {
    push(errors, "$.subject_id", "TYPE_MISMATCH", "Expected non-empty subject id.");
  }
  if (!uniqueStrings(input.tenant_scope, { minItems: 1 })) {
    push(errors, "$.tenant_scope", "INVALID_SCOPE", "Tenant scope must be unique, non-empty, and contain no wildcard.");
  }
  if (!uniqueStrings(input.location_scope)) {
    push(errors, "$.location_scope", "INVALID_SCOPE", "Location scope must be unique and contain no wildcard.");
  }

  if (!uniqueStrings(input.capability_set, { minItems: 1, maxLength: 64, forbidWildcard: false })) {
    push(errors, "$.capability_set", "INVALID_CAPABILITY", "Capability set must be a unique non-empty string array.");
  } else {
    for (const capability of input.capability_set) {
      if (!CAPABILITY_PATTERN.test(capability) || FORBIDDEN_CAPABILITIES.has(capability)) {
        push(errors, "$.capability_set", "INVALID_CAPABILITY", `Invalid capability: ${capability}`);
      } else if (!options.knownCapabilities.has(capability)) {
        push(errors, "$.capability_set", "UNKNOWN_CAPABILITY", `Unknown capability: ${capability}`);
      }
    }
  }

  if (!AUTHENTICATION_LEVELS.includes(input.authentication_level as never)) {
    push(errors, "$.authentication_level", "UNKNOWN_ENUM", "Unknown authentication level.");
  }

  for (const key of ["issued_at", "last_activity_at", "expires_at", "absolute_expires_at"] as const) {
    if (!isIsoDateTime(input[key])) {
      push(errors, `$.${key}`, "TYPE_MISMATCH", "Expected ISO date-time string.");
    }
  }
  validateTimestampOrder(input, errors);

  if (!SESSION_STATES.includes(input.session_state as never)) {
    push(errors, "$.session_state", "UNKNOWN_ENUM", "Unknown session state.");
  }
  if (!REVOCATION_STATES.includes(input.revocation_state as never)) {
    push(errors, "$.revocation_state", "UNKNOWN_ENUM", "Unknown revocation state.");
  }

  if (input.revoked_at !== null && !isIsoDateTime(input.revoked_at)) {
    push(errors, "$.revoked_at", "TYPE_MISMATCH", "Expected null or ISO date-time string.");
  }
  if (input.revocation_reason !== null && !REVOCATION_REASONS.includes(input.revocation_reason as never)) {
    push(errors, "$.revocation_reason", "UNKNOWN_ENUM", "Unknown revocation reason.");
  }

  if (!Number.isInteger(input.session_version) || (input.session_version as number) < 1) {
    push(errors, "$.session_version", "TYPE_MISMATCH", "Expected integer >= 1.");
  }
  if (!nonEmptyString(input.created_by_auth_event_id)) {
    push(errors, "$.created_by_auth_event_id", "TYPE_MISMATCH", "Expected non-empty auth event id.");
  }
  if (
    input.last_authorization_event_id !== undefined &&
    input.last_authorization_event_id !== null &&
    !nonEmptyString(input.last_authorization_event_id)
  ) {
    push(errors, "$.last_authorization_event_id", "TYPE_MISMATCH", "Expected null or non-empty authorization event id.");
  }

  if (input.session_state === "ACTIVE") {
    if (input.revocation_state !== "NOT_REVOKED" || input.revoked_at !== null || input.revocation_reason !== null) {
      push(errors, "$", "INVALID_SESSION_STATE", "ACTIVE session must be NOT_REVOKED with null revocation metadata.");
    }
  }

  if (input.revocation_state === "REVOKED") {
    if (input.session_state !== "REVOKED" || !isIsoDateTime(input.revoked_at) || input.revocation_reason === null) {
      push(errors, "$", "INVALID_REVOCATION_STATE", "REVOKED session requires REVOKED state, revoked_at, and revocation_reason.");
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as AdminSessionRecordV1 };
}

export function validateAuthorizationRequestV1(input: unknown): ContractValidationResult<AuthorizationRequestV1> {
  const errors: ContractValidationError[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: [{ path: "$", code: "TYPE_MISMATCH", message: "Expected object." }] };
  }

  if (!hasOnlyKeys(input, AUTH_REQUEST_KEYS)) {
    push(errors, "$", "UNKNOWN_FIELD", "Authorization request contains an unknown field.");
  }
  if (input.schema_version !== AUTHORIZATION_REQUEST_SCHEMA_VERSION) {
    push(errors, "$.schema_version", "UNKNOWN_ENUM", "Unsupported schema version.");
  }
  if (!nonEmptyString(input.request_id)) {
    push(errors, "$.request_id", "TYPE_MISMATCH", "Expected non-empty request id.");
  }
  if (typeof input.session_reference !== "string" || !OPAQUE_SESSION_PATTERN.test(input.session_reference)) {
    push(errors, "$.session_reference", "TYPE_MISMATCH", "Expected 43-character unpadded base64url opaque session reference.");
  }
  if (!nonEmptyString(input.requested_resource, 256)) {
    push(errors, "$.requested_resource", "TYPE_MISMATCH", "Expected non-empty resource id.");
  }
  if (typeof input.requested_action !== "string" || !ACTION_PATTERN.test(input.requested_action)) {
    push(errors, "$.requested_action", "TYPE_MISMATCH", "Expected canonical uppercase action.");
  }

  for (const key of ["requested_tenant_id", "requested_location_id"] as const) {
    const value = input[key];
    if (value !== undefined && (!nonEmptyString(value) || value === "*")) {
      push(errors, `$.${key}`, "INVALID_SCOPE", "Requested scope must be non-empty and cannot be wildcard.");
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as AuthorizationRequestV1 };
}

export function validateAuthorizationDecisionV1(input: unknown): ContractValidationResult<AuthorizationDecisionV1> {
  const errors: ContractValidationError[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: [{ path: "$", code: "TYPE_MISMATCH", message: "Expected object." }] };
  }

  if (input.schema_version !== AUTHORIZATION_DECISION_SCHEMA_VERSION) {
    push(errors, "$.schema_version", "UNKNOWN_ENUM", "Unsupported schema version.");
  }
  if (!nonEmptyString(input.request_id)) {
    push(errors, "$.request_id", "TYPE_MISMATCH", "Expected non-empty request id.");
  }
  if (!nonEmptyString(input.policy_version)) {
    push(errors, "$.policy_version", "TYPE_MISMATCH", "Expected non-empty policy version.");
  }
  if (!nonEmptyString(input.authorization_event_id)) {
    push(errors, "$.authorization_event_id", "TYPE_MISMATCH", "Expected non-empty authorization event id.");
  }

  if (input.decision === "ALLOW") {
    if (!hasOnlyKeys(input, ALLOW_DECISION_KEYS)) {
      push(errors, "$", "UNKNOWN_FIELD", "ALLOW decision contains an unknown or forbidden field.");
    }
    if (!nonEmptyString(input.subject_id)) {
      push(errors, "$.subject_id", "TYPE_MISMATCH", "ALLOW requires a non-empty subject id.");
    }
  } else if (input.decision === "DENY") {
    if (!hasOnlyKeys(input, DENY_DECISION_KEYS)) {
      push(errors, "$", "UNKNOWN_FIELD", "DENY decision contains an unknown or forbidden field.");
    }
    if (!AUTHORIZATION_DENY_CODES.includes(input.deny_code as never)) {
      push(errors, "$.deny_code", "UNKNOWN_ENUM", "DENY requires a recognized deny code.");
    }
  } else {
    push(errors, "$.decision", "UNKNOWN_ENUM", "Decision must be ALLOW or DENY.");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as AuthorizationDecisionV1 };
}
