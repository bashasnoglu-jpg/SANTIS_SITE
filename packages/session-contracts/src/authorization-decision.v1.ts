export const AUTHORIZATION_DECISION_SCHEMA_VERSION = "1.0.0" as const;

export const AUTHORIZATION_DECISIONS = ["ALLOW", "DENY"] as const;
export type AuthorizationDecision = (typeof AUTHORIZATION_DECISIONS)[number];

export const AUTHORIZATION_DENY_CODES = [
  "NO_SESSION",
  "INVALID_SESSION",
  "SESSION_NOT_FOUND",
  "SESSION_EXPIRED",
  "SESSION_REVOKED",
  "SUBJECT_NOT_FOUND",
  "SERVICE_IDENTITY_INVALID",
  "TENANT_SCOPE_MISMATCH",
  "LOCATION_SCOPE_MISMATCH",
  "CAPABILITY_DENIED",
  "RESOURCE_POLICY_DENIED",
  "AUTHORITY_STORE_UNAVAILABLE",
  "POLICY_UNAVAILABLE",
  "CONTRACT_INVALID",
] as const;
export type AuthorizationDenyCode = (typeof AUTHORIZATION_DENY_CODES)[number];

export interface AuthorizationAllowDecisionV1 {
  schema_version: typeof AUTHORIZATION_DECISION_SCHEMA_VERSION;
  request_id: string;
  decision: "ALLOW";
  subject_id: string;
  policy_version: string;
  authorization_event_id: string;
}

export interface AuthorizationDenyDecisionV1 {
  schema_version: typeof AUTHORIZATION_DECISION_SCHEMA_VERSION;
  request_id: string;
  decision: "DENY";
  deny_code: AuthorizationDenyCode;
  policy_version: string;
  authorization_event_id: string;
}

export type AuthorizationDecisionV1 =
  | AuthorizationAllowDecisionV1
  | AuthorizationDenyDecisionV1;

export const AuthorizationDecisionV1Schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "santis://session-contracts/authorization-decision/v1",
  title: "AuthorizationDecisionV1",
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: [
        "schema_version",
        "request_id",
        "decision",
        "subject_id",
        "policy_version",
        "authorization_event_id",
      ],
      properties: {
        schema_version: { const: AUTHORIZATION_DECISION_SCHEMA_VERSION },
        request_id: { type: "string", minLength: 1, maxLength: 128 },
        decision: { const: "ALLOW" },
        subject_id: { type: "string", minLength: 1, maxLength: 128 },
        policy_version: { type: "string", minLength: 1, maxLength: 128 },
        authorization_event_id: { type: "string", minLength: 1, maxLength: 128 },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: [
        "schema_version",
        "request_id",
        "decision",
        "deny_code",
        "policy_version",
        "authorization_event_id",
      ],
      properties: {
        schema_version: { const: AUTHORIZATION_DECISION_SCHEMA_VERSION },
        request_id: { type: "string", minLength: 1, maxLength: 128 },
        decision: { const: "DENY" },
        deny_code: { enum: AUTHORIZATION_DENY_CODES },
        policy_version: { type: "string", minLength: 1, maxLength: 128 },
        authorization_event_id: { type: "string", minLength: 1, maxLength: 128 },
      },
    },
  ],
} as const;
