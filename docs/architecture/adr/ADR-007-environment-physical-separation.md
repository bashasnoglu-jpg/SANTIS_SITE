# ADR-007 — Production and Non-Production Physical Separation

**Status:** Proposed  
**Decision Type:** Platform and Security Architecture  
**Version:** 0.9-RC2  
**Production Authority:** No

## Context

Santis OS currently uses explicit Live/Test context in Airtable because both operational and test workflows can exist within the same low-code environment. Carrying the same pattern into PostgreSQL would increase the risk of test data, fixtures, credentials or destructive tools affecting production.

The platform has already experienced the class of risk created when development or test tooling can reach shared host resources. Environment separation must therefore be enforced primarily by infrastructure boundaries, not by a single row field or application condition.

## Decision

Production and non-production Santis OS data SHALL be physically separated.

At minimum, production, staging and development/test environments MUST use separate databases and separate credentials. Production secrets MUST NOT be available to non-production runtimes, local tools, test agents or sandbox environments.

The `environment` field MAY remain in Airtable projections, migration evidence and controlled fixture records, but it MUST NOT be the primary isolation control for production PostgreSQL data.

## Normative Requirements

- Production and non-production MUST use separate PostgreSQL databases or clusters approved by architecture review.
- Credentials, service accounts, backups and encryption keys MUST be environment-specific.
- Production application roles MUST NOT authenticate against staging or test databases with the same secret.
- Test automation MUST NOT connect to production endpoints.
- Production data MUST NOT be copied to non-production unless an approved sanitization and legal process exists.
- Deployment promotion MUST move code and versioned migrations, not mutable database contents.
- Break-glass access MUST be environment-specific, time-bounded and audited.
- Airtable Live/Test selectors MUST NOT be treated as equivalent to physical production separation.
- Backup and restore tests MUST execute in isolated recovery environments.

## Alternatives Considered

### Single database with `environment_id`

Rejected as the primary model because it increases RLS complexity, index overhead and the blast radius of mistaken credentials or destructive queries.

### Separate schemas in one database

Rejected for production isolation because database-level credentials and administrative operations can still cross schema boundaries.

### Separate database per tenant and environment

Deferred. It may be appropriate for regulated or high-tier tenants later, but creates unnecessary provisioning and migration complexity for the current platform stage.

## Consequences

### Positive

- Reduces the blast radius of test and development failures.
- Prevents production access through ordinary non-production credentials.
- Simplifies reasoning about fixtures, destructive tests and environment-specific migration state.
- Supports controlled backup, restore and incident procedures.

### Negative

- Requires separate provisioning, migrations, monitoring and secret management.
- Cross-environment debugging becomes less convenient.
- Test data must be synthesized or sanitized rather than copied casually.
- Configuration drift must be detected and managed.

## Evidence Required

Production acceptance requires:

- documented environment inventory,
- distinct database endpoints and credentials,
- proof that test credentials fail against production,
- secret-scope verification in deployment platforms,
- isolated backup restore test,
- environment promotion and rollback runbooks,
- sanitized-data policy,
- audit evidence for privileged access.

## Related Documents

- `volume-2-technical-architecture/02-transaction-context-and-rls.md`
- ADR-002 — PostgreSQL as Canonical Authority
- ADR-006 — LOCK-59 Defense-in-Depth Isolation

## Current Decision Status

**Normative Design / Production Not Approved**
