# Transaction Context Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines how trusted actor, tenant and location context is established and propagated inside PostgreSQL transactions.

## TCC-01 — Trusted Source

Transaction context MUST be derived from authenticated identity, verified membership and owner-side authorization. Client-supplied tenant/location identifiers MUST NOT be trusted alone.

## TCC-02 — Transaction-Local Scope

Context MUST be set inside the active database transaction using transaction-local configuration, for example `set_config(..., true)` or an approved equivalent.

Session-persistent tenant context is prohibited for transaction-pooled connections.

## TCC-03 — Required Context

Applicable transactions MUST establish:

- actor identity and type,
- tenant ID,
- location ID where required,
- trace ID,
- authorization decision reference,
- command ID or causation ID.

Missing required context MUST fail closed before canonical access.

## TCC-04 — Pooling Safety

The design MUST be safe under PgBouncer transaction pooling. Context MUST expire automatically at commit or rollback and MUST NOT leak to the next borrower of a pooled connection.

## TCC-05 — Role Separation

Production application connections MUST use a non-owner, non-superuser role without `BYPASSRLS`.

Migration, table owner, audit writer and break-glass roles MUST be separate from the application role.

## TCC-06 — RLS Enforcement

Tenant-scoped canonical tables MUST enable RLS where specified and SHOULD use `FORCE ROW LEVEL SECURITY` to include the table owner in policy enforcement.

Policies MUST define both read visibility (`USING`) and write admissibility (`WITH CHECK`) where applicable.

## TCC-07 — Transaction Boundary

Context establishment, authorization-dependent reads and canonical mutations MUST occur in one explicit transaction when they protect the same invariant.

On any failure, the transaction MUST roll back. A connection MUST NOT be returned to the pool with an open transaction.

## TCC-08 — Background Workers

Workers MUST resolve their own scoped service identity and MUST establish transaction-local context per unit of work.

A worker MUST NOT process multiple tenants in one transaction unless an approved administrative design explicitly permits it.

## TCC-09 — Break-Glass

Emergency privileged access MUST be time-bounded, approved, strongly authenticated and fully audited. Break-glass access MUST NOT be used for routine application traffic.

## TCC-10 — Stable Errors

Expected errors include:

- `AUTHENTICATION_REQUIRED`
- `AUTHORIZATION_DENIED`
- `TENANT_CONTEXT_MISSING`
- `LOCATION_CONTEXT_MISSING`
- `TENANT_MEMBERSHIP_INVALID`
- `RLS_CONTEXT_INVALID`
- `TRANSACTION_CONTEXT_LEAK_DETECTED`

## Acceptance Tests

Tests MUST cover missing context, wrong tenant, wrong location, owner-role behaviour, non-owner app role, pooled-connection reuse, rollback cleanup, worker scope, `USING` and `WITH CHECK` enforcement and zero cross-tenant visibility.

## References

- ADR-006 — LOCK-59 Defense-in-Depth Isolation
- ADR-007 — Production/Non-Production Physical Separation
- `02-transaction-context-and-rls.md`

---

End of Document
