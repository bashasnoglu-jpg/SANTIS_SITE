# Availability and Resource Claim Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines how Santis OS validates availability and creates authoritative claims for therapists, rooms and other capacity-controlled resources.

## ARC-01 — Ownership

The Availability bounded context owns resource claims and overlap decisions. Booking MUST NOT infer availability from UI state, Airtable views or stale projections.

## ARC-02 — Time Interval

Authoritative claims MUST use half-open intervals: `[start_at, end_at)`.

Claim duration MUST include configured preparation, cleanup or transition buffers where those buffers block the resource.

## ARC-03 — Scope

Every claim MUST include:

- `tenant_id`
- `location_id`
- resource type
- resource canonical ID
- start and end timestamps
- claim status
- booking or hold reference
- aggregate/version metadata

Resource tenant and location MUST match the command context exactly.

## ARC-04 — Eligibility

Before a claim is accepted, the owner MUST validate:

- resource active status,
- tenant and location ownership,
- service capability,
- shift/working-hours eligibility,
- room type or equipment requirements,
- requested capacity,
- permitted overlap policy.

Missing context MUST fail closed.

## ARC-05 — Overlap Enforcement

Overlapping exclusive claims MUST be prevented by database-enforced constraints or an equivalent concurrency-safe mechanism.

A candidate implementation is a PostgreSQL GiST exclusion constraint over tenant, location, resource identity and `tstzrange(start_at, end_at, '[)')`.

Application-only pre-checks are insufficient.

## ARC-06 — Atomicity

Claims protecting booking creation or rescheduling MUST be committed atomically with the booking transition, idempotency evidence, audit and outbox record.

Multi-resource claims MUST be all-or-nothing.

## ARC-07 — Hold Lifecycle

Temporary holds MUST declare:

- hold owner,
- expiry timestamp,
- conversion rules,
- release behaviour,
- retry/recovery evidence.

Expired holds MUST NOT remain authoritative. Expiry workers MUST be idempotent.

## ARC-08 — Reschedule

Rescheduling MUST protect the existing valid claim until the replacement claim is secured or the entire operation rolls back.

The system MUST NOT release the original slot before replacement eligibility is known unless explicitly approved by policy.

## ARC-09 — Release

Cancellation, no-show policy or administrative release MUST use a published Availability command. Foreign contexts MUST NOT delete claim rows directly.

## ARC-10 — Outcomes

Stable decisions include:

- `AVAILABLE`
- `CLAIMED`
- `RELEASED`
- `RESOURCE_UNAVAILABLE`
- `RESOURCE_SCOPE_MISMATCH`
- `RESOURCE_INACTIVE`
- `CAPABILITY_MISMATCH`
- `SHIFT_MISMATCH`
- `CAPACITY_EXCEEDED`
- `HOLD_EXPIRED`
- `STALE_CLAIM_VERSION`

## Acceptance Tests

Tests MUST cover boundary-touching intervals, true overlaps, concurrent claims, multiple resources, cross-tenant and cross-location attempts, shift mismatch, inactive resource, hold expiry, reschedule rollback and fault injection.

## References

- ADR-006 — LOCK-59 Defense-in-Depth Isolation
- `05-availability-resource-claim.md`
- Booking Command Contract

---

End of Document
