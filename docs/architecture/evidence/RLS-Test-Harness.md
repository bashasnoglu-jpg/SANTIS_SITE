# PostgreSQL RLS Test Harness Evidence

**Document:** Santis OS Production Readiness Evidence Pack  
**Version:** 0.9-RC2  
**Evidence Type:** Database Isolation  
**Status:** NOT_STARTED  
**Production Authority:** No

---

## Purpose

Prove that PostgreSQL Row-Level Security enforces tenant and location isolation under the actual application-role and connection-pooling model.

## Scope

- application role privileges
- `ENABLE ROW LEVEL SECURITY`
- `FORCE ROW LEVEL SECURITY`
- `BYPASSRLS` absence
- owner-role separation
- transaction-local context
- default-deny behaviour
- pooled connection context reset

## Architecture References

- `../volume-2-technical-architecture/02-transaction-context-and-rls.md`
- `../contracts/transaction-context-contract.md`
- `../adr/ADR-006-lock59-defense-in-depth.md`
- `../adr/ADR-007-environment-physical-separation.md`

## Acceptance Criteria

The harness MUST prove:

- application role is not superuser,
- application role does not have `BYPASSRLS`,
- application role is not the table owner,
- RLS and FORCE RLS are active on scoped tables,
- missing tenant context returns zero rows or rejects writes,
- correct tenant context returns only authorized rows,
- wrong tenant context returns no foreign rows,
- `WITH CHECK` blocks cross-tenant inserts and updates,
- transaction-local context is cleared after commit/rollback,
- pooled connection reuse does not leak prior tenant context.

## Evidence Required

- GitHub Actions Run ID
- verified commit SHA
- PostgreSQL version
- PgBouncer mode/version where applicable
- role and privilege query outputs
- policy definitions
- table RLS flags
- SQL harness output
- connection reuse test output

## Execution Procedure

1. Apply migrations to an isolated test database.
2. Create at least two tenant datasets.
3. Connect using the production-equivalent application role.
4. Run role and policy introspection queries.
5. Execute read/write tests with no context, correct context and wrong context.
6. Commit and reuse the connection for another tenant.
7. Repeat after rollback.
8. Preserve raw SQL output and exit codes.

## Required SQL Evidence

```sql
SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname IN ('santis_app', 'santis_owner', 'santis_migrator');
```

```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('bookings', 'resource_claims', 'payments');
```

```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
ORDER BY schemaname, tablename, policyname;
```

## Observed Results

| Test | Expected | Observed | Result |
|---|---|---|---|
| App role not superuser | true | PENDING | NOT_RUN |
| App role no BYPASSRLS | true | PENDING | NOT_RUN |
| FORCE RLS enabled | true | PENDING | NOT_RUN |
| Missing context default deny | zero/reject | PENDING | NOT_RUN |
| Correct tenant read | own rows only | PENDING | NOT_RUN |
| Wrong tenant read | zero foreign rows | PENDING | NOT_RUN |
| Cross-tenant insert | rejected | PENDING | NOT_RUN |
| Cross-tenant update | rejected | PENDING | NOT_RUN |
| Context cleared after commit | true | PENDING | NOT_RUN |
| Context cleared after rollback | true | PENDING | NOT_RUN |
| Pool reuse isolation | true | PENDING | NOT_RUN |

## Evidence Links

- Workflow run: PENDING
- SQL transcript: PENDING
- Policy dump: PENDING
- Pooling test artifact: PENDING

## Decision

```yaml
Status: NOT_STARTED
Decision: BLOCKED
Reason: PostgreSQL RLS harness has not yet been executed and attached.
Production Authority: No
```

## Production Gate

RLS MAY be marked `PASS` only when all tests pass using production-equivalent roles, policies and pooling behaviour.

---

End of Document
