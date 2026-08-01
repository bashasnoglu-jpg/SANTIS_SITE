# Transaction Context and PostgreSQL Row-Level Security

**Document:** Santis OS Architecture Book  
**Volume:** 2 – Technical Architecture  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the normative requirements for establishing tenant and location context inside PostgreSQL transactions and for enforcing row-level isolation through PostgreSQL Row-Level Security (RLS).

This document implements the database enforcement portion of the LOCK-59 isolation contract.

RLS is a defense-in-depth control. It MUST NOT replace authentication, tenant membership validation, application authorization, domain validation, or database constraints.

---

# Scope

This contract applies to:

- tenant-scoped canonical tables
- location-scoped operational tables
- application database roles
- background workers
- projection workers
- administrative support tooling
- pooled database connections, including PgBouncer transaction pooling

This contract does not grant production approval. Production use requires the acceptance evidence defined in this document and in the LOCK-59 contract.

---

# Normative Requirements

## TCR-01 — Trusted Context Origin

Tenant and location context MUST originate from authenticated and authorized server-side identity resolution.

The backend MUST NOT trust `tenant_id`, `location_id`, role, or membership claims supplied directly by a client without independent server-side verification.

The verified context MUST be derived from:

- authenticated actor identity
- active tenant membership
- permitted locations
- active role or policy decision
- requested operation

---

## TCR-02 — Transaction-Local Context

Tenant and location context MUST be established inside the same database transaction that performs the protected operation.

Session-scoped `SET` commands MUST NOT be used for tenant isolation in pooled application connections.

The approved pattern is:

```sql
BEGIN;

SELECT set_config(
  'app.current_tenant_id',
  $1,
  true
);

SELECT set_config(
  'app.current_location_id',
  $2,
  true
);

SELECT set_config(
  'app.current_actor_id',
  $3,
  true
);

SELECT set_config(
  'app.current_trace_id',
  $4,
  true
);

-- authorized operation

COMMIT;
```

The third argument to `set_config` MUST be `true`, making the value transaction-local.

If any context value cannot be resolved, the transaction MUST be rolled back and the operation MUST fail closed.

---

## TCR-03 — Context Completeness

A protected transaction MUST NOT execute canonical reads or writes until all required context values have been set.

At minimum, tenant-scoped operations MUST establish:

- `app.current_tenant_id`
- `app.current_actor_id`
- `app.current_trace_id`

Location-scoped operations MUST additionally establish:

- `app.current_location_id`

Operations requiring elevated support or break-glass access MUST establish a separately audited support context. They MUST NOT reuse normal tenant context semantics.

---

## TCR-04 — Context Validation

Context variables MUST be validated before use.

RLS policies and helper functions MUST reject:

- missing values
- empty strings
- malformed UUIDs
- unauthorized tenant/location combinations
- inactive memberships

Context helper functions SHOULD use `current_setting(..., true)` so missing values can be handled explicitly rather than causing uncontrolled errors.

Example:

```sql
CREATE SCHEMA IF NOT EXISTS app_security;

CREATE OR REPLACE FUNCTION app_security.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT NULLIF(
    current_setting('app.current_tenant_id', true),
    ''
  )::uuid;
$$;
```

Security-definer functions MUST NOT be used to bypass RLS or privilege checks.

---

# Database Role Model

## TCR-05 — Role Separation

Database roles MUST be separated by responsibility.

The minimum role model is:

| Role | Purpose | RLS Behaviour |
|---|---|---|
| `santis_owner` | Object ownership and controlled migrations | Not used by runtime |
| `santis_migrator` | Schema migrations | Restricted operational use |
| `santis_app` | Backend runtime | RLS enforced |
| `santis_worker` | Background processing | RLS enforced unless explicitly scoped |
| `santis_readonly` | Controlled engineering/support reads | RLS enforced |
| `santis_audit_writer` | Append-only audit writes | Restricted to audit interface |

Production application traffic MUST NOT connect as:

- superuser
- table owner
- role with `BYPASSRLS`
- unrestricted migration role

---

## TCR-06 — Application Role Grants

The runtime role MUST receive only the minimum required privileges.

Example baseline:

```sql
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO santis_app;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE bookings
TO santis_app;

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
REVOKE ALL ON TABLES FROM PUBLIC;
```

Privileges MUST be granted per module or per explicit table set. Broad grants such as `GRANT ALL ON ALL TABLES` MUST NOT be used for production runtime roles.

---

# Row-Level Security Policy

## TCR-07 — RLS Enablement

Every tenant-scoped canonical table MUST enable RLS.

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
```

`FORCE ROW LEVEL SECURITY` MUST be used unless an approved ADR documents a justified exception.

An enabled table without applicable policies MUST behave as default deny.

---

## TCR-08 — Tenant Read Policy

Tenant-scoped reads MUST match the verified transaction-local tenant context.

```sql
CREATE POLICY bookings_tenant_select
ON bookings
FOR SELECT
TO santis_app
USING (
  tenant_id = app_security.current_tenant_id()
);
```

Location-scoped records SHOULD additionally require location match where the operation is location-bound.

```sql
CREATE POLICY bookings_location_select
ON bookings
FOR SELECT
TO santis_app
USING (
  tenant_id = app_security.current_tenant_id()
  AND location_id = app_security.current_location_id()
);
```

Policy design MUST avoid granting broader tenant-wide access when the application contract requires location-scoped access.

---

## TCR-09 — Insert and Update Policy

Writes MUST validate both existing-row visibility and the resulting row state.

```sql
CREATE POLICY bookings_write
ON bookings
FOR ALL
TO santis_app
USING (
  tenant_id = app_security.current_tenant_id()
  AND location_id = app_security.current_location_id()
)
WITH CHECK (
  tenant_id = app_security.current_tenant_id()
  AND location_id = app_security.current_location_id()
);
```

`WITH CHECK` MUST be present for inserts and updates so a caller cannot move a row into another tenant or location.

---

## TCR-10 — Cross-Tenant Mutation Prohibition

No runtime role MAY update tenant ownership fields on an existing canonical record.

The following fields SHOULD be immutable after creation:

- `tenant_id`
- canonical organization scope
- source system identity where applicable

Changing canonical ownership requires:

- approved ADR
- controlled migration
- audit evidence
- independent verification

---

# Composite Referential Integrity

## TCR-11 — Composite Tenant Constraints

RLS MUST be supported by referential constraints that prevent cross-tenant relationships.

Example:

```sql
ALTER TABLE locations
ADD CONSTRAINT locations_tenant_id_id_uq
UNIQUE (tenant_id, id);

ALTER TABLE bookings
ADD CONSTRAINT bookings_location_same_tenant_fk
FOREIGN KEY (tenant_id, location_id)
REFERENCES locations (tenant_id, id);
```

Where a booking references a therapist, room, package, payment, or client, the schema SHOULD use composite tenant-aware foreign keys or an equivalent constraint strategy.

RLS alone MUST NOT be treated as referential integrity.

---

# PgBouncer and Connection Pooling

## TCR-12 — Transaction Pooling Safety

When PgBouncer transaction pooling is used:

- all protected statements MUST execute inside an explicit transaction
- tenant context MUST be set after the transaction begins
- context MUST be transaction-local
- no protected query may run before context initialization
- the transaction MUST end with `COMMIT` or `ROLLBACK`

Session-level state MUST be treated as untrusted.

Prepared statements, connection reuse, or ORM abstractions MUST NOT create a path that executes protected SQL outside the context transaction.

---

## TCR-13 — ORM and Repository Enforcement

Repositories handling tenant-scoped data MUST require an authorized transaction context object.

Direct use of a global connection handle for tenant-scoped queries is prohibited.

Approved application shape:

```text
Authenticated Request
→ Authorization Resolution
→ Begin Transaction
→ Set Transaction-Local Context
→ Execute Command/Query Through Repository
→ Write Audit/Outbox Evidence
→ Commit or Rollback
```

The application SHOULD make it structurally difficult to execute tenant-scoped queries without the context wrapper.

---

# Background Workers

## TCR-14 — Worker Isolation

Background workers MUST process one authorized tenant scope at a time unless an approved cross-tenant administrative workflow exists.

Each job MUST carry:

- tenant identity
- location scope where applicable
- command or event identity
- trace or correlation identity

Workers MUST establish transaction-local context before reading or mutating protected data.

A worker processing multiple tenants in one database transaction is prohibited.

---

# Administrative and Break-Glass Access

## TCR-15 — No Silent Bypass

Administrative support access MUST NOT silently bypass RLS.

Break-glass access requires:

- explicit reason
- authenticated privileged actor
- time-bounded approval
- separate database role or controlled interface
- tamper-evident audit record
- post-access review

Routine debugging MUST use RLS-enforced read-only roles.

---

# Error Handling

## TCR-16 — Stable Error Classification

Context or RLS failures MUST be translated into stable application error codes.

Minimum error codes:

| Code | Meaning |
|---|---|
| `AUTH_CONTEXT_MISSING` | Required transaction context absent |
| `AUTH_CONTEXT_INVALID` | Context malformed or unverifiable |
| `TENANT_ACCESS_DENIED` | Actor lacks tenant membership |
| `LOCATION_ACCESS_DENIED` | Actor lacks location access |
| `ROW_ACCESS_DENIED` | RLS or authorization denied row access |
| `CROSS_TENANT_REFERENCE_BLOCKED` | Composite ownership constraint rejected relationship |
| `SECURITY_CONTEXT_SETUP_FAILED` | Transaction-local context could not be established |

Raw database error messages MUST NOT be returned to external clients.

---

# Audit Requirements

## TCR-17 — Security Evidence

Every denied privileged or state-changing operation SHOULD preserve:

- actor ID
- tenant ID if resolved
- location ID if resolved
- action
- resource type
- resource ID if known
- trace ID
- denial code
- timestamp

Audit logs MUST NOT contain authentication secrets or unnecessary personal data.

A context setup failure MUST be treated as a security-relevant event.

---

# Testing Contract

## TCR-18 — Required Negative Tests

The RLS test harness MUST prove at minimum:

1. Tenant A cannot read Tenant B rows.
2. Tenant A cannot update Tenant B rows.
3. Tenant A cannot delete Tenant B rows.
4. Tenant A cannot insert a row owned by Tenant B.
5. A valid tenant with the wrong location cannot access location-scoped rows.
6. Missing context returns no protected data and performs no mutation.
7. Malformed context performs no mutation.
8. The application runtime role cannot bypass RLS.
9. The application runtime role is not table owner.
10. `FORCE ROW LEVEL SECURITY` is enabled on protected tables.
11. A pooled connection does not retain prior tenant context.
12. A background worker cannot process a job under another tenant's context.
13. Composite foreign keys reject cross-tenant references.
14. Every rejected mutation leaves `mutation_count = 0`.

---

## TCR-19 — Required Positive Tests

The test harness MUST also prove:

1. Authorized Tenant A requests can read Tenant A rows.
2. Authorized location-scoped requests can access the permitted location.
3. Valid inserts and updates succeed under the correct context.
4. Context is cleared automatically after commit.
5. Context is cleared automatically after rollback.
6. RLS-protected queries remain usable through the approved PgBouncer mode.

---

## TCR-20 — Production Acceptance Gate

RLS MUST NOT be marked `PRODUCTION APPROVED` until all of the following are attached as evidence:

- migration SQL
- policy inventory
- protected-table inventory
- runtime-role privilege report
- table-owner report
- `BYPASSRLS` role report
- positive and negative test results
- PgBouncer state-leak test
- cross-tenant zero-leak test
- composite foreign-key test
- rollback test
- independent database review
- security review approval

---

# Performance and Indexing

## TCR-21 — Measured Performance

RLS performance MUST be evaluated against Santis OS query patterns and production-like data distributions.

Performance claims MUST be supported by:

```sql
EXPLAIN (ANALYZE, BUFFERS)
```

Index design MUST reflect actual access paths.

Example scheduler index candidate:

```sql
CREATE INDEX bookings_tenant_location_start_idx
ON bookings (tenant_id, location_id, start_at)
WHERE lifecycle_state NOT IN ('cancelled', 'archived');
```

This example is not automatically normative for every workload. Indexes MUST be validated with measured plans and representative data.

---

# Environment Isolation

## TCR-22 — Physical Environment Separation

Production and non-production PostgreSQL data SHOULD be physically separated into different databases or database clusters.

RLS MUST NOT be used as the primary boundary between production and test data.

An `environment` field MAY remain in Airtable projections, test fixtures, or migration evidence, but it MUST NOT replace physical production isolation.

The final decision is governed by `ADR-007 — Production and Non-Production Physical Separation`.

---

# Status

Current architecture status:

| Capability | Status |
|---|---|
| Transaction-local context contract | Normative Design |
| PostgreSQL RLS policies | Normative Design |
| Runtime app-role isolation | Acceptance Pending |
| PgBouncer state-leak verification | Acceptance Pending |
| Cross-tenant zero-leak harness | Acceptance Pending |
| Production approval | Not Approved |

---

# Summary

Santis OS MUST establish trusted tenant and location context inside every protected database transaction.

PostgreSQL RLS MUST enforce that context using non-owner, non-superuser, non-`BYPASSRLS` runtime roles, supported by composite referential constraints and application-layer authorization.

No protected operation may run under missing, stale, client-supplied, or session-leaked context.

This document is normative and SHALL be treated as the authoritative transaction-context and RLS contract for Santis OS.

---

End of Document
