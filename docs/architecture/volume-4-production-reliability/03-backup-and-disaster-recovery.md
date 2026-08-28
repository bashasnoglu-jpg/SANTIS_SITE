# Backup and Disaster Recovery

**Document:** Santis OS Architecture Book  
**Volume:** 4 – Production Reliability Foundations  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines backup, restore and disaster-recovery requirements for canonical and projection data.

---

# Objectives

Initial engineering targets:

- RPO: <= 5 minutes for PostgreSQL canonical state.
- RTO: <= 60 minutes for critical booking operations.
- Restore-test success: 100% of scheduled exercises.

These are targets, not proven production guarantees.

---

# Backup Scope

Backups MUST cover:

- PostgreSQL canonical tables,
- idempotency claims,
- resource claims,
- outbox and consumer checkpoints where required,
- audit evidence,
- schema migrations and role/policy definitions,
- encryption-key metadata and recovery procedures,
- essential configuration.

Airtable exports and projections SHOULD be backed up for governance continuity, but MUST NOT be treated as canonical recovery sources.

---

# Backup Controls

Backups MUST be:

- encrypted in transit and at rest,
- access controlled independently from application credentials,
- retained according to approved policy,
- protected from routine application deletion,
- monitored for completion and integrity,
- copied to an independent failure domain where required.

Backup success without restore verification is insufficient.

---

# Point-in-Time Recovery

Production PostgreSQL SHOULD support point-in-time recovery.

Recovery procedures MUST document:

- target timestamp selection,
- WAL or equivalent replay boundaries,
- transaction-integrity verification,
- RLS and role restoration,
- outbox duplicate-delivery handling,
- projection rebuild/reconciliation.

---

# Restore Testing

Restore exercises MUST occur at least quarterly and after material storage or topology changes.

Each exercise MUST record:

- backup identifier,
- target environment,
- start and completion time,
- achieved RPO/RTO,
- integrity checks,
- failed steps,
- corrective actions,
- reviewer approval.

Restores MUST be executed into an isolated environment unless responding to a declared incident.

---

# Recovery Order

Recommended recovery order:

1. infrastructure and secrets,
2. database roles and policies,
3. canonical PostgreSQL state,
4. audit and idempotency evidence,
5. outbox workers,
6. query models and projections,
7. Airtable governance projection,
8. external notifications and analytics.

Canonical writes MUST remain disabled until integrity and isolation checks pass.

---

# Disaster Declaration

A disaster MAY be declared when:

- the primary database is unrecoverable within normal incident procedures,
- data corruption exceeds local repair scope,
- region or provider failure blocks critical operations,
- verified security compromise requires environment replacement.

The Incident Commander owns activation and recovery sequencing.

---

# Production Acceptance Gate

Production approval requires a documented restore plan, at least one successful isolated restore exercise, verified credentials/role recovery, RLS checks, and projection reconciliation evidence.

---

End of Document
