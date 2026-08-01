# Idempotency Contract

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the mandatory idempotency rules for externally retriable commands in Santis OS.

The purpose of idempotency is to ensure that retries, network duplication, worker replay, client resubmission, and concurrent execution do not create duplicate canonical business effects.

This contract applies to commands including, but not limited to:

- `CreateBookingCommand`
- `RecordPaymentCommand`
- `ConsumePackageEntitlementCommand`
- `CreateCommissionAccrualCommand`
- `IssueRefundCommand`
- `CreateInventoryMovementCommand`

Internal state changes executed inside a single successful database transaction MAY rely on transaction integrity and optimistic concurrency rather than independent idempotency keys.

---

# Normative Definitions

## Idempotency Key

A client- or caller-supplied identifier representing one logical command attempt across retries.

## Payload Fingerprint

A deterministic cryptographic digest calculated from the canonical representation of the command payload.

## Claim

A durable database record reserving an idempotency identity before canonical mutation occurs.

## Replay

Returning the durable outcome of a previously completed command without producing a new business effect.

## Conflict

Rejecting reuse of an existing idempotency key with a different canonical payload fingerprint.

## Recovery

A controlled process for resolving a durable claim whose original execution did not reach a terminal state.

---

# IC-01 — Scope

Every externally retriable state-changing command MUST carry an idempotency key.

Commands that can be duplicated by any of the following MUST be treated as externally retriable:

- HTTP retries
- mobile or browser resubmission
- queue redelivery
- automation replay
- worker restart
- webhook duplication
- timeout without confirmed response
- AI or operator tool re-execution

Read-only queries SHOULD NOT require idempotency keys unless they trigger durable side effects.

---

# IC-02 — Idempotency Identity

The durable uniqueness boundary MUST include enough context to prevent collisions across tenants and command types.

The minimum uniqueness scope SHALL be:

```text
(tenant_id, command_type, idempotency_key)
```

Where location-specific command semantics require it, `location_id` MAY be included in the uniqueness boundary.

An idempotency key MUST NOT be treated as globally unique unless the implementation explicitly guarantees global uniqueness.

---

# IC-03 — Durable Authority

PostgreSQL MUST be the authoritative idempotency store for production commands.

Redis, memory caches, local files, Airtable fields, browser storage, or queue metadata MUST NOT be the sole authority for canonical idempotency.

Caches MAY accelerate replay responses, but cache loss MUST NOT permit duplicate canonical mutations.

---

# IC-04 — Canonical Payload

The payload fingerprint MUST be computed from a canonical serialization of the command.

Canonical serialization MUST:

- preserve semantic field values
- normalize object key order
- normalize date-time representation
- normalize numeric representation
- apply explicit rules for missing and `undefined` values
- exclude transport-only metadata that does not change business intent
- include contract version where schema interpretation affects semantics

The same business intent MUST produce the same fingerprint.

A semantically different business intent MUST produce a different fingerprint.

Raw request byte order MUST NOT be used as the business fingerprint authority.

---

# IC-05 — Required Claim Fields

A durable command claim MUST contain at least:

| Field | Requirement |
|---|---|
| `tenant_id` | REQUIRED |
| `command_type` | REQUIRED |
| `idempotency_key` | REQUIRED |
| `payload_fingerprint` | REQUIRED |
| `contract_version` | REQUIRED |
| `claim_status` | REQUIRED |
| `result_code` | REQUIRED when terminal |
| `result_resource_id` | REQUIRED when a canonical resource is created |
| `trace_id` | REQUIRED |
| `created_at` | REQUIRED |
| `updated_at` | REQUIRED |

Implementations SHOULD also retain:

- actor identity
- location identity
- execution attempt count
- first completion timestamp
- terminal error code
- recovery reference

---

# IC-06 — Claim Status Model

The normative claim states are:

```text
CLAIMED
COMPLETED
REJECTED
FAILED_RECOVERABLE
FAILED_TERMINAL
QUARANTINED
```

A claim MUST NOT be reported as `COMPLETED` before the canonical mutation and durable result are committed.

A claim with no durable canonical result MUST NOT be replayed as success.

---

# IC-07 — Execution Outcomes

For an incoming command, the system MUST produce one of the following decision classes.

## CREATED or COMPLETED

The key was not previously claimed, the command passed validation, and exactly one canonical business effect was committed.

## REPLAYED

The same key and same payload fingerprint already completed successfully.

The original durable outcome MUST be returned.

No new canonical mutation is allowed.

## IDEMPOTENCY_CONFLICT

The same key exists with a different payload fingerprint.

The command MUST be rejected.

No canonical mutation is allowed.

## IN_PROGRESS

The same key and same fingerprint are currently under active execution and the implementation cannot yet return a terminal outcome.

The caller MAY receive a bounded retry instruction.

## RECOVERY_REQUIRED

A durable non-terminal claim exists and automatic execution safety cannot be proven.

The command MUST fail closed and enter controlled recovery or quarantine.

---

# IC-08 — Atomicity

The following operations MUST occur within one transaction where they belong to the same consistency boundary:

1. acquire or create the idempotency claim
2. validate the existing fingerprint
3. perform authorization and domain checks
4. create or update canonical state
5. attach the resulting canonical resource to the claim
6. write required audit evidence
7. write required outbox events
8. mark the claim terminal

If the transaction rolls back, none of these operations may remain partially committed.

Partial canonical writes are prohibited.

---

# IC-09 — Concurrency

Concurrent commands using the same idempotency identity MUST produce one authoritative outcome.

For same key and same fingerprint:

- at most one execution may create the canonical effect
- all other executions MUST return replay, in-progress, or the same terminal result

For same key and different fingerprint:

- no execution may overwrite the original claim
- all mismatched executions MUST return `IDEMPOTENCY_CONFLICT`

Concurrency safety MUST be enforced by database constraints and transaction semantics, not only by application-level pre-checks.

---

# IC-10 — Reference PostgreSQL Constraint

A reference durable uniqueness model is:

```sql
CREATE TABLE command_claims (
  tenant_id uuid NOT NULL,
  command_type text NOT NULL,
  idempotency_key text NOT NULL,
  payload_fingerprint text NOT NULL,
  contract_version text NOT NULL,
  claim_status text NOT NULL,
  result_code text,
  result_resource_id uuid,
  trace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, command_type, idempotency_key)
);
```

This DDL is illustrative and MUST be adapted through approved migrations and domain-specific foreign keys.

---

# IC-11 — Retry Rules

Blind mutation retries are prohibited.

A retry MAY occur only when:

- the same idempotency key is preserved
- the same canonical payload fingerprint is preserved
- retry count is bounded
- backoff is bounded and observable
- retry cannot create a duplicate canonical effect

A retry MUST NOT generate a new idempotency key for the same logical user intent.

---

# IC-12 — Replay Rules

Replay MUST use durable evidence.

Replay MUST return the original result class and canonical resource identity where available.

Replay MUST NOT:

- execute domain side effects again
- create duplicate audit facts representing a new business effect
- create duplicate outbox facts for the same completed aggregate transition
- recalculate historical financial results using current rules

A replay response MAY produce a new transport trace, but MUST preserve causation to the original command.

---

# IC-13 — Recovery of Incomplete Claims

A non-terminal claim MUST NOT be assumed to be safe for automatic continuation.

Recovery logic MUST inspect durable evidence including:

- claim status
- canonical resource reference
- aggregate version
- audit event presence
- outbox event presence
- transaction outcome evidence
- last execution timestamp

If a canonical effect exists but the claim lacks a terminal result, recovery MAY reconcile the claim to the existing canonical effect after verification.

If safety cannot be proven, the claim MUST enter `QUARANTINED` or `RECOVERY_REQUIRED` state.

Recovery MUST NOT create a second canonical resource as a shortcut.

---

# IC-14 — Financial Commands

Financial commands require stronger retention and replay guarantees.

For payments, refunds, settlements, package consumption, commissions, journals, and ledger entries:

- idempotency claims MUST be durable
- TTL-based deletion MUST NOT be the only retention mechanism
- historical replay MUST preserve the original financial result
- rule changes MUST NOT silently recalculate completed financial commands
- reconciliation evidence MUST be retained

---

# IC-15 — Multi-Tenant Isolation

Idempotency claims MUST be tenant-scoped.

A claim from one tenant MUST NOT:

- block another tenant's command
- reveal another tenant's result
- replay another tenant's resource
- be queried without authorized tenant context

RLS and application authorization SHOULD protect command claim tables where tenant-scoped access is exposed.

---

# IC-16 — Observability

The system MUST emit operational telemetry for:

- claim creation rate
- replay rate
- conflict rate
- in-progress duration
- recoverable failure count
- quarantine count
- duplicate prevention count
- claim processing latency

Metrics MUST NOT expose raw idempotency keys or sensitive payload data.

---

# IC-17 — Audit Requirements

Every terminal command outcome MUST retain enough evidence to determine:

- who initiated the command
- which tenant and location were affected
- which idempotency identity was used
- which canonical fingerprint was evaluated
- whether the result was created, replayed, rejected, conflicted, or failed
- which canonical resource was affected
- which trace and contract version were used

Audit records SHOULD store a protected or hashed representation of the idempotency key rather than exposing the raw value where unnecessary.

---

# Stable Error Codes

The following error codes are normative:

| Code | Meaning |
|---|---|
| `IDEMPOTENCY_KEY_MISSING` | Required key absent |
| `IDEMPOTENCY_KEY_INVALID` | Key format invalid |
| `IDEMPOTENCY_FINGERPRINT_INVALID` | Canonical fingerprint cannot be produced |
| `IDEMPOTENCY_CONFLICT` | Same key, different payload |
| `IDEMPOTENCY_IN_PROGRESS` | Existing command still active |
| `IDEMPOTENCY_RECOVERY_REQUIRED` | Existing claim is incomplete or ambiguous |
| `IDEMPOTENCY_CLAIM_CORRUPT` | Claim violates durable invariants |
| `IDEMPOTENCY_RESULT_MISSING` | Completed claim lacks required result evidence |
| `IDEMPOTENCY_SCOPE_MISMATCH` | Tenant, command type, or scope mismatch |

Implementations MAY define more specific codes but MUST preserve these decision classes.

---

# Acceptance Test Matrix

## Positive Scenarios

| Scenario | Expected Result |
|---|---|
| New key and valid payload | Exactly one canonical effect |
| Same key and same payload after success | Replay original result |
| Same key and same payload concurrently | One create, remaining replay/in-progress |
| Valid recovery with existing canonical resource | Claim reconciled without duplicate |

## Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Missing key | Reject, zero canonical mutation |
| Same key, different payload | `IDEMPOTENCY_CONFLICT`, zero mutation |
| Cross-tenant claim lookup | Denied, zero information leakage |
| Claim exists but fingerprint missing | Quarantine or terminal failure |
| Claim terminal but resource missing | Recovery required; no duplicate create |
| Retry uses new key for same intent | Test must detect duplicate-risk violation |
| Cache cleared after successful command | Durable replay still succeeds |
| Worker crashes after claim but before commit | No partial canonical write |
| Worker crashes after canonical write in same transaction | Entire transaction rolls back or completes atomically |

---

# Concurrency Acceptance Gate

The production acceptance suite MUST execute at least 20–25 concurrent submissions using the same idempotency identity.

The expected result is:

- exactly one canonical business effect
- zero duplicate canonical resources
- zero partial writes
- one authoritative result identity
- all remaining requests return replay, in-progress, or the same terminal outcome

The suite MUST also execute same-key/different-payload concurrency and prove that all mismatched payloads are rejected.

---

# Fault Injection Requirements

Fault injection SHOULD cover at least:

- after claim acquisition
- after authorization
- after domain validation
- after canonical insert
- after audit insert
- after outbox insert
- before commit
- after commit but before response

For each point, the test MUST prove whether replay, retry, or recovery returns the correct authoritative result without duplicate business effects.

---

# Production Approval Gates

This contract MUST NOT be considered production-approved until all of the following are satisfied:

- durable PostgreSQL claim schema deployed
- unique constraint verified
- canonical fingerprint contract tested
- replay and conflict acceptance passed
- 20–25 concurrent request test passed
- fault injection passed
- zero partial-write evidence recorded
- cross-tenant isolation test passed
- recovery procedure documented and tested
- metrics and audit evidence available
- independent reviewer approval recorded

---

# Current Architecture Status

| Capability | Status |
|---|---|
| Durable PostgreSQL idempotency design | Normative Design |
| BK-P0 claim implementation | Acceptance Pending |
| Same-payload replay behavior | Partially Verified |
| Different-payload conflict behavior | Partially Verified |
| Concurrency acceptance | Pending |
| Fault-injection acceptance | Pending |
| Recovery runbook | Pending |
| Production approval | Not Approved |

---

# Summary

Santis OS treats idempotency as a durable business integrity guarantee, not as a temporary cache optimization.

Every externally retriable command MUST preserve one logical identity across retries. PostgreSQL constraints and transaction semantics MUST ensure that one logical command produces at most one canonical business effect.

Same-key/same-payload execution replays the original result. Same-key/different-payload execution fails closed with `IDEMPOTENCY_CONFLICT`. Ambiguous incomplete claims enter controlled recovery rather than creating replacement resources.

---

End of Document
