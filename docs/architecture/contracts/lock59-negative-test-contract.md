# LOCK-59 Negative Test Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines the mandatory negative acceptance tests proving that tenant, location, environment and resource isolation fail closed with zero unauthorized mutation.

## LNT-01 — Test Principle

Every rejection scenario MUST prove both:

1. the expected stable error/reason code, and
2. zero unauthorized canonical mutation.

A red UI message without database evidence is insufficient.

## LNT-02 — Required Scenarios

The suite MUST include at minimum:

- missing tenant context,
- invalid tenant membership,
- wrong tenant booking request,
- missing location context,
- unauthorized location,
- wrong-location therapist,
- wrong-location room,
- inactive therapist or room,
- environment boundary mismatch during the Airtable transition,
- missing branch configuration,
- multiple matching branch configurations,
- missing resource ownership link,
- resource link cardinality greater than one where singularity is required,
- raw canonical booking create attempt,
- automation bypass attempt,
- AI direct-mutation attempt,
- stale aggregate version,
- duplicate idempotency key with changed payload,
- concurrent cross-tenant attempts.

## LNT-03 — Expected Behaviour

Negative tests MUST return deterministic reason codes such as:

- `TENANT_CONTEXT_MISSING`
- `TENANT_SCOPE_MISMATCH`
- `LOCATION_CONTEXT_MISSING`
- `LOCATION_SCOPE_MISMATCH`
- `RESOURCE_SCOPE_MISMATCH`
- `RESOURCE_INACTIVE`
- `CONFIG_MISSING`
- `CONFIG_CARDINALITY_INVALID`
- `RAW_CREATE_BLOCKED`
- `AUTHORIZATION_DENIED`
- `IDEMPOTENCY_CONFLICT`
- `STALE_AGGREGATE_VERSION`

## LNT-04 — Zero-Mutation Evidence

For every rejection, evidence MUST verify unchanged counts and versions for:

- bookings,
- resource claims,
- payments where relevant,
- outbox success events,
- projections,
- canonical links.

A security/audit rejection event MAY be written when explicitly designed, but it MUST NOT be confused with a successful business mutation.

## LNT-05 — Isolation Layers

Tests MUST exercise:

- API authorization,
- domain guard,
- database constraints,
- RLS `USING` and `WITH CHECK`,
- restricted application role,
- pooled transaction context,
- Airtable request adapter boundary.

## LNT-06 — Concurrency

Concurrent negative tests MUST demonstrate that racing requests cannot bypass scope checks or create partial resource claims.

## LNT-07 — Evidence Format

Each test record MUST include:

- test ID,
- contract/version,
- fixture IDs,
- actor and scope,
- command fingerprint,
- expected and actual outcome,
- mutation counts before/after,
- trace ID,
- database role,
- relevant logs or query output,
- reviewer and review date.

## LNT-08 — Fixture Governance

Fixtures MUST be immutable or versioned. Live operational records MUST NOT be repurposed as acceptance fixtures without explicit approval.

## Production Gate

LOCK-59 MUST remain `ACCEPTANCE PENDING` until the complete negative matrix passes in an environment representative of production and the evidence is independently reviewed.

## References

- ADR-006 — LOCK-59 Defense-in-Depth Isolation
- LOCK-59 Isolation Contract
- Transaction Context Contract
- Booking Command Contract

---

End of Document
