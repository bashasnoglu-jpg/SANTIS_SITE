export const AUTHORIZATION_REQUEST_SCHEMA_VERSION = "1.0.0" as const;

export interface AuthorizationRequestV1 {
  schema_version: typeof AUTHORIZATION_REQUEST_SCHEMA_VERSION;
  request_id: string;
  session_reference: string;
  requested_resource: string;
  requested_action: string;
  requested_tenant_id?: string;
  requested_location_id?: string;
}

/**
 * session_reference is a 256-bit opaque token encoded as unpadded base64url.
 * This contract treats requested_* fields as claims-to-check, never as authority.
 */
export const AuthorizationRequestV1Schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "santis://session-contracts/authorization-request/v1",
  title: "AuthorizationRequestV1",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "request_id",
    "session_reference",
    "requested_resource",
    "requested_action",
  ],
  properties: {
    schema_version: { const: AUTHORIZATION_REQUEST_SCHEMA_VERSION },
    request_id: { type: "string", minLength: 1, maxLength: 128 },
    session_reference: { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" },
    requested_resource: { type: "string", minLength: 1, maxLength: 256 },
    requested_action: { type: "string", pattern: "^[A-Z][A-Z0-9_]{1,63}$" },
    requested_tenant_id: { type: "string", minLength: 1, maxLength: 128, not: { const: "*" } },
    requested_location_id: { type: "string", minLength: 1, maxLength: 128, not: { const: "*" } },
  },
} as const;

export const AUTHORIZATION_REQUEST_SENSITIVE_FIELDS = ["session_reference"] as const;
