import test from "node:test";
import assert from "node:assert/strict";

import {
  validateAdminSessionRecordV1,
  validateAuthorizationDecisionV1,
  validateAuthorizationRequestV1,
} from "../src/validators";

const knownCapabilities = new Set(["BOOKING_READ", "BOOKING_WRITE"]);

const validSession = () => ({
  schema_version: "1.0.0",
  session_id_hash: `sha256:${"a".repeat(64)}`,
  subject_id: "usr_123",
  tenant_scope: ["tenant_123"],
  location_scope: ["location_123"],
  capability_set: ["BOOKING_READ"],
  authentication_level: "AAL2",
  issued_at: "2026-08-22T08:00:00.000Z",
  last_activity_at: "2026-08-22T08:05:00.000Z",
  expires_at: "2026-08-22T08:30:00.000Z",
  absolute_expires_at: "2026-08-22T16:00:00.000Z",
  session_state: "ACTIVE",
  revocation_state: "NOT_REVOKED",
  revoked_at: null,
  revocation_reason: null,
  session_version: 1,
  created_by_auth_event_id: "auth_evt_123",
});

test("1/8 valid admin session is accepted", () => {
  const result = validateAdminSessionRecordV1(validSession(), { knownCapabilities });
  assert.equal(result.ok, true);
});

test("2/8 wildcard tenant scope is denied", () => {
  const input = { ...validSession(), tenant_scope: ["*"] };
  const result = validateAdminSessionRecordV1(input, { knownCapabilities });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((error) => error.code === "INVALID_SCOPE"));
});

test("3/8 additional session property is denied", () => {
  const input = { ...validSession(), is_super_admin: true };
  const result = validateAdminSessionRecordV1(input, { knownCapabilities });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((error) => error.code === "UNKNOWN_FIELD"));
});

test("4/8 unknown capability is denied", () => {
  const input = { ...validSession(), capability_set: ["UNKNOWN_CAPABILITY"] };
  const result = validateAdminSessionRecordV1(input, { knownCapabilities });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((error) => error.code === "UNKNOWN_CAPABILITY"));
});

test("5/8 invalid timestamp ordering is denied", () => {
  const input = {
    ...validSession(),
    last_activity_at: "2026-08-22T09:00:00.000Z",
    expires_at: "2026-08-22T08:30:00.000Z",
  };
  const result = validateAdminSessionRecordV1(input, { knownCapabilities });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => error.code === "INVALID_TIMESTAMP_RELATIONSHIP"));
  }
});

test("6/8 valid 43-character opaque authorization request is accepted", () => {
  const result = validateAuthorizationRequestV1({
    schema_version: "1.0.0",
    request_id: "req_123",
    session_reference: "A".repeat(43),
    requested_resource: "booking:123",
    requested_action: "READ",
    requested_tenant_id: "tenant_123",
    requested_location_id: "location_123",
  });
  assert.equal(result.ok, true);
});

test("7/8 valid ALLOW decision is accepted", () => {
  const result = validateAuthorizationDecisionV1({
    schema_version: "1.0.0",
    request_id: "req_123",
    decision: "ALLOW",
    subject_id: "usr_123",
    policy_version: "admin-authz-v1",
    authorization_event_id: "authz_evt_123",
  });
  assert.equal(result.ok, true);
});

test("8/8 unknown DENY code is denied", () => {
  const result = validateAuthorizationDecisionV1({
    schema_version: "1.0.0",
    request_id: "req_124",
    decision: "DENY",
    deny_code: "UNKNOWN_DENY_CODE",
    policy_version: "admin-authz-v1",
    authorization_event_id: "authz_evt_124",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.some((error) => error.code === "UNKNOWN_ENUM"));
});
