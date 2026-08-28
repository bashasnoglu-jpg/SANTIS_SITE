# Failure Philosophy

**Document:** Santis OS Architecture Book  
**Volume:** 1 – Architecture Principles  
**Version:** 0.9-RC2  
**Status:** Normative Draft

---

# Purpose

This document defines how Santis OS MUST behave under uncertainty, validation failure, authorization failure, dependency failure, concurrency, partial execution risk, projection drift, and recovery conditions.

Correct failure behavior is a core architectural capability and a production-readiness requirement.

The platform MUST prefer a controlled, explainable failure over an apparently successful but unverifiable outcome.

---

# Failure Classes

Santis OS recognizes the following failure classes:

- validation failure;
- authorization failure;
- tenant or location context failure;
- concurrency conflict;
- idempotency conflict;
- dependency timeout or unavailability;
- transaction failure;
- projection failure or lag;
- financial reconciliation failure;
- security-control failure;
- data-integrity failure;
- recovery failure.

Each production capability MUST classify its expected failures using stable error or reason codes.

Human-readable messages MAY change without changing the stable machine-readable classification.

---

# FP-01 — Fail Closed

When authorization, ownership, context, capability, or policy compliance cannot be proven, the operation MUST be rejected.

The platform MUST NOT grant access or perform a mutation based on assumptions, stale UI state, display-name matching, missing policy results, or partial configuration.

Examples requiring fail-closed behavior include:

- missing tenant membership;
- ambiguous location scope;
- unresolved actor identity;
- missing branch configuration;
- stale or contradictory resource identity;
- missing payment authority;
- failed RLS context initialization;
- unavailable authorization policy decision.

Read-only degradation MAY be permitted only where the capability contract explicitly defines it as safe.

---

# FP-02 — Never Guess

Missing or contradictory operational context MUST NOT be inferred.

The platform MUST NOT guess:

- tenant;
- location;
- actor;
- role or permission;
- resource ownership;
- therapist or room identity;
- service identity;
- payment state;
- package entitlement;
- financial classification;
- lifecycle state.

Incomplete information MUST produce one of the following controlled outcomes:

- rejected;
- blocked;
- quarantined;
- manual review required;
- reconciliation required.

The selected outcome MUST be recorded with a stable reason code.

---

# FP-03 — No Silent Financial Repair

Financial, payment, settlement, package, gift-card, commission, and ledger inconsistencies MUST NOT be silently corrected.

Detected inconsistencies MUST enter an approved reconciliation, adjustment, reversal, or correction workflow.

The platform MUST NOT rewrite historical financial facts merely to make totals match.

An automated process MAY propose a correction, but high-risk financial corrections MUST require the approval defined by the relevant accounting and authorization policies.

Every correction MUST preserve a relationship to the original record or fact.

---

# FP-04 — No Blind Retry

A mutation MUST NOT be retried blindly.

A retry MAY occur only when all of the following conditions are satisfied:

- the operation retains the same idempotency identity;
- the canonical payload fingerprint is unchanged;
- the failure is classified as transient or explicitly retryable;
- the retry count is bounded;
- the delay policy is bounded and observable;
- duplicate canonical state or duplicate business effects cannot occur.

Retries SHOULD use bounded exponential backoff with jitter where appropriate.

Permanent validation, authorization, idempotency-conflict, or domain-invariant failures MUST NOT be retried automatically.

---

# FP-05 — Durable Replay

Replay MUST only execute from durable and verifiable evidence.

Durable evidence MAY include:

- a persisted command record;
- an immutable attempt record;
- a canonical outbox event;
- an approved recovery manifest;
- a verified source-system snapshot.

Replay MUST preserve:

- original command identity;
- idempotency identity;
- payload fingerprint;
- actor or delegated authority context where valid;
- causation and correlation identity;
- applicable contract version.

Replay MUST NOT create duplicate business effects.

Replay MUST be distinguishable from a newly submitted command in audit evidence.

---

# FP-06 — Resume from Known Checkpoints

A multi-step workflow MAY resume only from an explicitly persisted checkpoint.

A workflow MUST NOT infer successful completion of a prior step from missing errors, UI state, or best-effort external observation.

A checkpoint MUST identify:

- workflow identity;
- completed step;
- resulting resource identity;
- version or fingerprint;
- timestamp;
- next permitted transition.

Resume behavior MUST be idempotent and concurrency-safe.

---

# FP-07 — Concurrency Integrity

Concurrent commands MUST produce one authoritative outcome per business identity and invariant.

Expected command result classifications MAY include:

- `SUCCESS`;
- `REPLAY`;
- `IDEMPOTENCY_CONFLICT`;
- `CONCURRENCY_CONFLICT`;
- `RESOURCE_CONFLICT`;
- `REJECTED`.

Concurrent execution MUST NOT produce:

- duplicate bookings;
- duplicate payments;
- duplicate entitlement usage;
- duplicate commission accrual;
- overlapping exclusive therapist claims;
- overlapping exclusive room claims;
- lost updates;
- partial canonical records.

Application-level pre-checks without database-level enforcement MUST NOT be treated as a complete concurrency guarantee.

---

# FP-08 — Zero Partial Write

A failed canonical command MUST leave no unapproved partial business state.

Canonical writes, idempotency claims, resource claims, audit linkage, and transactional outbox writes that belong to one consistency boundary SHOULD commit atomically.

When a distributed external side effect cannot participate in the same transaction, the workflow MUST define:

- durable pending state;
- retry or reconciliation policy;
- compensation policy where valid;
- timeout behavior;
- human escalation path.

A partially completed operation MUST NOT be reported as fully successful.

---

# FP-09 — Deterministic Decisions within a Defined Snapshot

Given:

- identical canonical command input;
- identical authorized state snapshot;
- identical policy and contract versions;
- identical relevant time reference;

the platform MUST produce the same decision class.

The same command submitted at a later time against changed availability, inventory, policy, or account state MAY legitimately produce a different new decision.

However, a previously completed command submitted with the same idempotency identity and payload fingerprint MUST return the original recorded outcome regardless of later state changes.

Decision evidence SHOULD record the relevant version or snapshot identities required to explain the outcome.

---

# FP-10 — Human Approval for High-Risk Operations

High-risk operations MUST require explicit human approval unless an approved policy defines a narrower safe automation boundary.

Examples include:

- refunds above a configured threshold;
- financial adjustments;
- bulk deletion or anonymization;
- privilege escalation;
- role or membership changes;
- production configuration changes;
- cross-location bulk operations;
- destructive AI-initiated actions;
- manual overrides of tenant-isolation or financial gates.

Approval MUST identify:

- approver;
- requested action;
- scope;
- reason;
- timestamp;
- applicable policy;
- expiry where relevant.

The requester and approver SHOULD be different actors for the highest-risk operation classes.

---

# FP-11 — Evidence Preservation

Failure and rejection evidence MUST be preserved at a level appropriate to risk and data-classification requirements.

The platform SHOULD retain:

- trace and correlation identifiers;
- command identifiers;
- idempotency identities;
- stable error or reason codes;
- authorization decision references;
- affected resource identifiers;
- dependency and timeout classification;
- retry, replay, or resume count;
- relevant contract versions.

Sensitive personal data, secrets, credentials, payment credentials, and unrestricted payloads MUST NOT be copied into logs merely for troubleshooting convenience.

Evidence retention MUST comply with privacy, legal, security, and data-retention policies.

---

# FP-12 — Safe Dependency Failure

A dependency timeout or outage MUST produce behavior explicitly defined by the capability contract.

A dependency failure MAY result in:

- fail-closed rejection;
- durable pending state;
- delayed projection;
- read-only degradation;
- queued notification;
- reconciliation required.

A dependency failure MUST NOT cause the platform to fabricate a successful authoritative result.

Timeouts MUST be bounded. Infinite waiting is prohibited.

Critical dependencies MUST have observable health and failure-rate signals.

---

# FP-13 — Projection Failure Does Not Rewrite Authority

A failed, delayed, stale, or contradictory projection MUST NOT modify canonical state to match the projection.

Projection failures MUST be recorded and reconciled using exact canonical identifiers and versions.

Where an operational interface depends on a stale projection, the interface MUST indicate staleness or block high-risk actions according to the capability contract.

Airtable, analytics, cache, and search-index drift MUST NOT be treated as proof that PostgreSQL canonical state is wrong.

---

# FP-14 — Security-Control Failure Is a Security Event

Failure of a mandatory security control MUST NOT be treated as an ordinary availability issue.

Examples include:

- RLS context not established;
- authorization policy unavailable;
- audit writer unavailable for a mandatory audited mutation;
- unexpected `BYPASSRLS` role use;
- cross-tenant query result;
- secret or credential leakage;
- unapproved production write path.

The affected operation MUST fail closed unless a formally approved emergency procedure states otherwise.

The event MUST be recorded and escalated according to the security incident policy.

---

# FP-15 — Recovery Safety over Speed

When multiple recovery strategies exist, the safest verified strategy MUST be preferred over the fastest unverified strategy.

Data integrity, tenant isolation, financial correctness, and auditability take precedence over rapid restoration of write availability.

Recovery MUST NOT proceed from an unverified backup, incomplete evidence package, or unknown schema version.

A recovery procedure SHOULD include:

- restore target;
- source backup or checkpoint;
- integrity verification;
- schema and contract version;
- reconciliation plan;
- owner and approver;
- rollback or abort condition.

---

# FP-16 — Explicit Failure Communication

Machine-readable failure responses MUST use stable classifications.

User-facing messages SHOULD explain the next safe action without exposing secrets, internal credentials, SQL, or cross-tenant information.

A failure response SHOULD distinguish among:

- user-correctable validation issue;
- authorization denial;
- resource conflict;
- temporary dependency issue;
- reconciliation or manual-review requirement;
- internal incident.

The UI MUST NOT display success when the backend result is unknown, timed out, rolled back, or pending reconciliation.

---

# FP-17 — Chaos and Fault-Injection Validation

Critical failure behavior MUST be tested, not merely documented.

High-risk command paths SHOULD include fault-injection tests at relevant boundaries such as:

- after idempotency claim;
- after resource claim;
- after canonical insert;
- before commit;
- after commit but before response;
- before outbox publication;
- during projection update.

Acceptance evidence MUST demonstrate that failures do not create unauthorized, duplicate, or partial business effects.

Fault-injection testing MUST run in an isolated non-production environment unless an explicitly approved production chaos policy exists.

---

# Failure Decision Priorities

When multiple outcomes are possible, Santis OS MUST apply the following priority order:

1. protect tenant isolation and confidentiality;
2. protect financial and entitlement integrity;
3. protect canonical consistency;
4. preserve audit and recovery evidence;
5. provide an explicit and actionable failure result;
6. preserve read availability where safely possible;
7. restore write availability only after integrity is proven.

---

# Summary

Santis OS is designed to fail safely rather than continue under uncertainty.

The platform MUST reject unverifiable mutations, preserve durable evidence, prevent duplicate or partial effects, distinguish retry from replay and resume, and require human approval for high-risk actions.

Operational correctness, tenant isolation, financial integrity, and auditability take precedence over convenience, throughput, and automatic recovery.

---

End of Document
