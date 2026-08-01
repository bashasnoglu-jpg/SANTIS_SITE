# Observability

**Document:** Santis OS Architecture Book  
**Volume:** 4 – Production Reliability Foundations  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines logging, metrics, tracing, health and alerting requirements for Santis OS.

---

# Signals

Production capabilities MUST expose:

- structured logs,
- metrics,
- distributed traces or equivalent trace continuity,
- health/readiness signals,
- business-integrity indicators.

Console output alone is insufficient.

---

# Trace Context

Commands, events and projections MUST preserve:

- `trace_id`,
- `correlation_id`,
- `causation_id`,
- owner module,
- tenant/location scope where safe,
- deployment SHA.

Trace propagation MUST NOT expose unnecessary PII.

---

# Required Metrics

At minimum:

- booking command count, success, rejection and failure,
- booking P50/P95/P99 latency,
- idempotency replay and conflict rate,
- duplicate and partial-write invariant violations,
- RLS/context failures,
- resource-claim conflicts,
- outbox pending count and oldest age,
- consumer lag and dead-letter count,
- projection delay,
- payment reconciliation drift,
- privileged and AI-originated high-risk actions.

---

# Logging

Logs MUST be structured and machine searchable.

Logs MUST NOT contain:

- credentials,
- raw payment secrets,
- unrestricted health or guest notes,
- full request payloads containing unnecessary PII.

Stable error codes and trace identifiers SHOULD be preferred over free-text-only errors.

---

# Health and Readiness

Liveness MUST indicate process health.

Readiness MUST indicate whether the instance can safely serve its declared capability.

A service MUST NOT report ready when critical database context, migrations, policy configuration or required dependencies are invalid.

---

# Alerting

Alerts MUST be actionable, owned and linked to a runbook.

Paging SHOULD be reserved for conditions requiring immediate human action.

Zero-tolerance alerts include:

- cross-tenant anomaly,
- duplicate canonical mutation,
- partial financial write,
- audit-chain verification failure,
- unrecoverable outbox loss.

---

# Dashboard Minimum

Operational dashboards SHOULD show:

- SLO status and error-budget burn,
- latency and error trends,
- booking writer health,
- RLS/context failures,
- outbox and projection lag,
- database saturation and lock waits,
- incident/change annotations.

---

# Production Acceptance Gate

Production approval requires working dashboards, alert routes, trace continuity verification and runbook-linked alerts for critical conditions.

---

End of Document
