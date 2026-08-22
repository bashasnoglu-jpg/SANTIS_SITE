export const ADMIN_SESSION_SCHEMA_VERSION = "1.0.0" as const;

export const AUTHENTICATION_LEVELS = ["AAL1", "AAL2", "AAL3"] as const;
export type AuthenticationLevel = (typeof AUTHENTICATION_LEVELS)[number];

export const SESSION_STATES = ["ACTIVE", "EXPIRED", "REVOKED"] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export const REVOCATION_STATES = ["NOT_REVOKED", "REVOKED"] as const;
export type RevocationState = (typeof REVOCATION_STATES)[number];

export const REVOCATION_REASONS = [
  "USER_LOGOUT",
  "ADMIN_REVOKE",
  "ROLE_CHANGED",
  "PASSWORD_CHANGED",
  "SECURITY_EVENT",
  "SESSION_ROTATED",
  "ACCOUNT_DISABLED",
  "UNKNOWN",
] as const;
export type RevocationReason = (typeof REVOCATION_REASONS)[number];

export interface AdminSessionRecordV1 {
  schema_version: typeof ADMIN_SESSION_SCHEMA_VERSION;
  session_id_hash: `sha256:${string}`;
  subject_id: string;
  tenant_scope: string[];
  location_scope: string[];
  capability_set: string[];
  authentication_level: AuthenticationLevel;
  issued_at: string;
  last_activity_at: string;
  expires_at: string;
  absolute_expires_at: string;
  session_state: SessionState;
  revocation_state: RevocationState;
  revoked_at: string | null;
  revocation_reason: RevocationReason | null;
  session_version: number;
  created_by_auth_event_id: string;
  last_authorization_event_id?: string | null;
}

/**
 * Draft 2020-12 JSON Schema. This describes data shape only.
 * Semantic authorization checks remain server-side and fail-closed.
 */
export const AdminSessionRecordV1Schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "santis://session-contracts/admin-session-record/v1",
  title: "AdminSessionRecordV1",
  type: "object",
  additionalProperties: false,
  required: [
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
  ],
  properties: {
    schema_version: { const: ADMIN_SESSION_SCHEMA_VERSION },
    session_id_hash: { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
    subject_id: { type: "string", minLength: 1, maxLength: 128 },
    tenant_scope: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: { type: "string", minLength: 1, maxLength: 128, not: { const: "*" } },
    },
    location_scope: {
      type: "array",
      uniqueItems: true,
      items: { type: "string", minLength: 1, maxLength: 128, not: { const: "*" } },
    },
    capability_set: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: {
        type: "string",
        pattern: "^[A-Z][A-Z0-9_]{2,63}$",
        not: { enum: ["*", "ALL", "ADMIN_ALL"] },
      },
    },
    authentication_level: { enum: AUTHENTICATION_LEVELS },
    issued_at: { type: "string", format: "date-time" },
    last_activity_at: { type: "string", format: "date-time" },
    expires_at: { type: "string", format: "date-time" },
    absolute_expires_at: { type: "string", format: "date-time" },
    session_state: { enum: SESSION_STATES },
    revocation_state: { enum: REVOCATION_STATES },
    revoked_at: { type: ["string", "null"], format: "date-time" },
    revocation_reason: { type: ["string", "null"], enum: [null, ...REVOCATION_REASONS] },
    session_version: { type: "integer", minimum: 1 },
    created_by_auth_event_id: { type: "string", minLength: 1, maxLength: 128 },
    last_authorization_event_id: { type: ["string", "null"], minLength: 1, maxLength: 128 },
  },
} as const;
