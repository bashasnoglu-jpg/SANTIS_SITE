# Incident Response

**Document:** Santis OS Architecture Book  
**Volume:** 4 – Production Reliability Foundations  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines incident classification, command structure, evidence preservation and recovery governance.

---

# Severity Model

| Severity | Definition | Examples |
|---|---|---|
| SEV-1 | Critical integrity, security or broad availability failure | Cross-tenant leak, duplicate financial mutation, canonical corruption |
| SEV-2 | Major capability degraded with significant operational impact | Booking writer unavailable, payment reconciliation blocked |
| SEV-3 | Limited degradation with workaround | Projection lag, delayed notifications |
| SEV-4 | Minor defect or observation | Non-critical dashboard discrepancy |

Any cross-tenant access, unauthorized privilege escalation or confirmed canonical financial corruption MUST be treated as SEV-1.

---

# Incident Roles

A SEV-1 or SEV-2 incident MUST assign:

- Incident Commander,
- Technical Lead,
- Communications Lead,
- Evidence Recorder,
- Business/Operations Liaison.

One person MAY hold multiple roles only when team size requires it and the Incident Commander records the decision.

---

# Response Phases

1. Detect and declare.
2. Contain.
3. Preserve evidence.
4. Stabilize service.
5. Recover safely.
6. Verify business integrity.
7. Communicate closure.
8. Complete post-incident review.

Safety and evidence preservation take precedence over rapid unverified recovery.

---

# Containment Rules

Responders MAY:

- disable feature flags,
- pause workers,
- block canonical mutations,
- revoke credentials,
- isolate a tenant/location scope,
- switch interfaces to read-only.

Responders MUST NOT perform destructive cleanup before evidence capture unless necessary to stop active harm.

---

# Evidence Preservation

Evidence SHOULD include:

- trace and correlation identifiers,
- command and event IDs,
- deployment SHA,
- database role/session identity,
- relevant audit records,
- screenshots or exported logs,
- timeline of human actions,
- affected tenant/location scope.

Credentials and unnecessary PII MUST NOT be copied into incident records.

---

# Communication

External communication MUST be factual, scoped and approved by the Incident Commander or designated business owner.

Unverified causes MUST be labeled as hypotheses.

Security or privacy incidents MUST follow applicable legal notification procedures and counsel review.

---

# Recovery Verification

Before reopening writes, the team MUST verify:

- tenant isolation,
- canonical consistency,
- idempotency behaviour,
- resource-claim integrity,
- outbox/consumer state,
- audit continuity,
- projection reconciliation.

---

# Post-Incident Review

SEV-1 and SEV-2 incidents REQUIRE a blameless review containing:

- impact,
- detection gap,
- timeline,
- contributing conditions,
- containment and recovery actions,
- corrective actions with owners and dates,
- architecture/runbook changes.

---

End of Document
