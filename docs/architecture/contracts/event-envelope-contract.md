# Event Envelope Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines the mandatory envelope, naming, versioning, ordering and privacy rules for Santis OS domain and integration events.

## EEC-01 — Mandatory Envelope

Every published event MUST include:

- `event_id`
- `event_type`
- `schema_version`
- `aggregate_type`
- `aggregate_id`
- `aggregate_version`
- `tenant_id` where tenant-scoped
- `location_id` where location-scoped
- `occurred_at`
- `recorded_at`
- `actor_id` and `actor_type` where applicable
- `trace_id`
- `correlation_id`
- `causation_id`
- `payload`

## EEC-02 — Event Identity

`event_id` MUST be globally unique and immutable. Consumers MUST use it for duplicate detection.

## EEC-03 — Naming

Event types MUST describe committed facts using a stable lower-case namespace, for example:

- `booking.created`
- `payment.recorded`
- `resource.claimed`

Version suffixes such as `_v1` SHOULD NOT be embedded in `event_type`; version belongs in `schema_version`.

## EEC-04 — Versioning

Backward-compatible additions MAY retain the same schema version when consumers tolerate unknown optional fields according to the registry policy.

Breaking changes REQUIRE:

- new schema version,
- migration and sunset plan,
- contract tests,
- consumer compatibility review,
- upcaster/downcaster strategy where replay is required.

## EEC-05 — Fact Semantics

Events MUST represent facts that committed successfully. They MUST NOT be used as pre-commit permission requests.

An event MUST NOT be published before the authoritative transaction commits.

## EEC-06 — Ordering

Global ordering is not guaranteed. Producers MUST provide monotonic `aggregate_version` for aggregates where order matters.

Consumers MUST detect duplicates and SHOULD detect version gaps before applying order-sensitive projections.

## EEC-07 — Delivery

Delivery is at-least-once. Consumers MUST be idempotent and MUST preserve failure evidence for retry, replay or dead-letter handling.

## EEC-08 — Causation and Correlation

`causation_id` identifies the immediate command or event that caused the fact. `correlation_id` groups an end-to-end business workflow. `trace_id` supports operational tracing.

These identifiers MUST be propagated without being regenerated unnecessarily.

## EEC-09 — Scope and Security

Tenant/location scope MUST be derived from canonical evidence. Consumers MUST enforce their own authorization and isolation boundaries when processing scoped events.

An event MUST NOT be treated as authorization proof for an unrelated action.

## EEC-10 — Data Minimization

Events MUST contain only data required by approved consumers. Sensitive PII, credentials, raw payment data and unrestricted notes MUST NOT be copied into general event streams.

Payload fields MUST be classified and documented in the contract registry.

## EEC-11 — AI Origin

AI-originated commands and facts MUST preserve `actor_type = AI_AGENT`, agent identity and human approval evidence where required.

## EEC-12 — Registry

Every event type/version MUST have a registry entry defining producer, consumers, schema, classification, retention, ordering expectation and deprecation status.

## Acceptance Tests

Producer and consumer tests MUST cover schema validation, duplicate delivery, missing scope, version gap, replay, unknown optional fields, breaking version rejection and PII minimization.

## References

- ADR-005 — Transactional Outbox
- `06-transactional-outbox.md`
- `07-event-envelope.md`

---

End of Document
