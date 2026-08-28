# Airtable Projection Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines Airtable's target role as a non-authoritative projection, governance and controlled-request surface after PostgreSQL becomes canonical.

## APC-01 — Authority Boundary

Airtable MUST NOT be treated as the canonical authority for booking, availability, payment, accounting, package entitlement or commission decisions after migration approval.

Airtable MAY provide:

- governance registers,
- operational projections,
- QA evidence tracking,
- reconciliation status,
- controlled request intake,
- human review queues.

## APC-02 — No Direct Canonical Mutation

Airtable automations, scripts and interfaces MUST NOT directly mutate PostgreSQL canonical tables.

Inbound actions MUST enter through published application commands with authentication, authorization, idempotency and audit.

## APC-03 — Projection Identity

Projected records SHOULD include:

- canonical resource type,
- canonical PostgreSQL ID,
- source aggregate version,
- projection contract version,
- projected timestamp,
- last reconciled timestamp,
- reconciliation status,
- projection error code,
- trace/correlation reference where applicable.

Airtable record IDs MUST NOT replace canonical PostgreSQL identifiers.

## APC-04 — Projection Semantics

Projection writes MUST be idempotent. A stale source version MUST NOT overwrite a newer projection.

The adapter MUST support replay from durable canonical evidence and SHOULD detect version gaps.

## APC-05 — Failure Behaviour

Projection failure MUST NOT roll back a committed canonical command.

Failures MUST enter bounded retry, replay or dead-letter handling and MUST expose projection lag and error status.

A failed or stale projection MUST NOT automatically repair canonical data.

## APC-06 — Controlled Request Tables

Where Airtable is used for request intake, request records MUST include:

- request identity,
- command type,
- contract version,
- idempotency key,
- actor/requester reference,
- tenant/location scope,
- requested payload,
- submission state,
- canonical result ID,
- stable error code,
- trace ID.

The request table MUST remain distinct from the projected canonical table.

## APC-07 — Tenant and Environment Isolation

Airtable interfaces and automations MUST enforce tenant, location and environment visibility rules during the transition.

Missing or ambiguous scope MUST fail closed. Production and test fixtures MUST be clearly separated and MUST NOT silently share mutation paths.

## APC-08 — Manual Edits

Manual edits to projected fields MUST be disabled or treated as non-authoritative annotations.

Any requested operational change MUST create a controlled command/request rather than modifying projected canonical fields directly.

## APC-09 — Reconciliation

The projection adapter MUST support reconciliation by comparing:

- canonical ID,
- source version,
- selected field fingerprint,
- projection timestamp,
- expected lifecycle state.

Drift MUST be reported; it MUST NOT be auto-repaired in financial or security-sensitive domains without approved procedure.

## APC-10 — Data Minimization

Only fields required for approved governance and operational use MAY be projected. Sensitive PII, payment secrets, credentials and unnecessary health/wellness notes MUST NOT be copied broadly.

## APC-11 — Decommissioning

Every Airtable-owned transition capability MUST have an exit criterion, replacement command/API and decommission plan.

Legacy automations MUST be inventoried and disabled once their canonical backend replacement is production approved.

## Acceptance Tests

Tests MUST cover idempotent upsert, stale version rejection, replay, projection outage, tenant/location mismatch, manual edit protection, request-to-command flow, reconciliation drift and zero canonical mutation from Airtable credentials.

## References

- ADR-002 — PostgreSQL as Canonical Authority
- ADR-003 — Airtable as Projection and Governance
- ADR-005 — Transactional Outbox
- ADR-006 — LOCK-59 Defense-in-Depth Isolation

---

End of Document
