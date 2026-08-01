# Deployment Strategy

**Document:** Santis OS Architecture Book  
**Volume:** 4 – Production Reliability Foundations  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines safe promotion, migration, rollout and rollback requirements for Santis OS.

---

# Environment Promotion

Production and non-production environments MUST be physically separated.

Changes MUST flow through:

```text
local/development
→ test
→ staging/shadow
→ production
```

Production MUST NOT be the first environment in which a migration, policy or command contract is executed.

---

# Deployment Requirements

Every deploy MUST have:

- immutable build identifier,
- source commit SHA,
- declared schema compatibility,
- migration plan,
- rollback or forward-fix plan,
- owner,
- change evidence,
- health-verification checklist.

Secrets MUST NOT be embedded in builds or source control.

---

# Backward-Compatible Delivery

Application and database changes SHOULD use expand-and-contract delivery:

1. add backward-compatible schema,
2. deploy compatible readers/writers,
3. backfill or reconcile,
4. verify usage,
5. remove deprecated paths in a later release.

A deployment MUST NOT require all clients, workers and projections to change atomically unless an approved maintenance procedure exists.

---

# Database Migration Rules

Migrations MUST:

- be version controlled,
- be repeatable in test,
- declare lock and runtime risk,
- avoid unbounded table rewrites during peak operations,
- preserve RLS and grants,
- include verification queries.

Destructive migrations MUST require explicit approval and verified backup/restore readiness.

Rollback of a database migration MUST NOT be assumed possible. Irreversible changes require a forward-recovery plan.

---

# Feature Flags

High-risk capabilities SHOULD be controlled by server-side feature flags.

Flags MUST:

- be tenant/location scoped where applicable,
- default to disabled for unapproved scope,
- be auditable,
- have an owner and expiry/review date,
- not bypass authorization or domain policy.

---

# Rollout

Production rollout SHOULD use staged exposure:

- internal/test tenant,
- controlled pilot location,
- limited percentage or capability scope,
- broader release after evidence review.

Canary success MUST include business integrity checks, not only HTTP health.

---

# Rollback and Stop Conditions

Rollout MUST stop on:

- cross-tenant anomaly,
- duplicate canonical mutation,
- partial write,
- unexplained payment drift,
- RLS context failure,
- critical outbox loss,
- restore uncertainty.

Application rollback MAY be used only when the deployed database contract remains compatible. Otherwise a controlled forward fix is required.

---

# Post-Deploy Verification

Verification MUST include:

- application health,
- database connectivity and role identity,
- RLS negative smoke test,
- booking read/write smoke test in approved scope,
- idempotency replay check,
- outbox publication check,
- projection lag check,
- error-rate and latency review.

---

# Production Acceptance Gate

No deployment process is production approved until promotion, rollback/forward-fix, migration safety and post-deploy verification have been exercised in staging.

---

End of Document
