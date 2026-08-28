# SLO, SLI and Error Budget

**Document:** Santis OS Architecture Book  
**Volume:** 4 – Production Reliability Foundations  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the initial reliability objectives for Santis OS. All targets are **Initial Engineering Targets** until production evidence proves or revises them.

---

# Reliability Principles

- Critical business invariants MUST be measured separately from availability.
- Cross-tenant unauthorized access target MUST be zero.
- Duplicate canonical mutation from one idempotency identity MUST be zero.
- Partial canonical writes after a failed command MUST be zero.
- Error-budget exhaustion MUST trigger reliability work before additional feature expansion.

---

# Initial SLI Catalogue

| Capability | SLI |
|---|---|
| Booking command availability | Successful authoritative booking responses / valid booking requests |
| Booking latency | End-to-end command duration from API receipt to authoritative commit |
| Idempotency integrity | Duplicate canonical records from identical idempotency identity |
| Tenant isolation | Unauthorized cross-tenant reads or writes |
| Projection freshness | Time from canonical commit to projection availability |
| Outbox health | Age and count of unpublished eligible events |
| Audit durability | Critical state changes with durable audit evidence |
| Restore readiness | Successful restore exercises / scheduled restore exercises |

---

# Initial Engineering Targets

| Capability | Target |
|---|---:|
| Booking command availability | >= 99.9% per calendar month |
| Booking create P95 | <= 750 ms |
| Booking create P99 | <= 1500 ms |
| Cross-tenant unauthorized read/write | 0 |
| Duplicate booking from same idempotency key | 0 |
| Partial write after failed command | 0 |
| Projection delay P95 | <= 30 seconds |
| Critical audit event loss | 0 |
| Outbox oldest publishable event | <= 60 seconds under normal load |
| Restore test success | 100% |
| RPO | <= 5 minutes |
| RTO | <= 60 minutes |

---

# Error Budget Policy

For availability SLOs, the monthly error budget is the difference between 100% and the approved SLO.

When 50% of the monthly budget is consumed before the midpoint of the month, the owning team SHOULD begin reliability remediation.

When 100% of the budget is consumed:

- non-critical feature rollout MUST stop,
- production changes MUST be limited to recovery, security and reliability work,
- the owner MUST produce a corrective action plan,
- Architecture and Operations owners MUST review restart conditions.

Zero-tolerance invariants such as tenant isolation, duplicate canonical mutation and partial financial writes do not have consumable error budgets. Any breach is an incident.

---

# Measurement Requirements

Measurements MUST:

- exclude synthetic traffic only through documented filters,
- preserve tenant-safe aggregation,
- distinguish business rejection from infrastructure failure,
- publish P50, P95 and P99 where latency applies,
- preserve trace identifiers for sampled failures,
- avoid PII in metric labels.

---

# Review Cadence

Targets SHOULD be reviewed quarterly and after any Severity 1 or Severity 2 incident.

A target MAY be tightened only after stable evidence exists. A target MUST NOT be weakened solely to hide reliability failure.

---

# Production Acceptance Gate

Production approval requires:

- defined metric sources,
- working dashboards,
- alert thresholds,
- at least one baseline period,
- owner assignment,
- evidence that zero-tolerance invariants are monitored.

---

End of Document
