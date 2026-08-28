# Runbook — RLS Context Failure

**Status:** Normative Draft  
**Production Authority:** No

## Trigger

Use when tenant/location transaction context is missing, invalid, leaked or produces unexpected RLS results.

## Immediate Actions

1. Treat any cross-tenant result as SEV-1.
2. Disable affected mutation and query paths.
3. Preserve session, trace, role and query evidence.
4. Verify the connected role is not superuser, owner or `BYPASSRLS`.

## Diagnosis

Check:

- transaction-local `set_config(..., true)`,
- transaction boundaries and rollback,
- PgBouncer pooling mode,
- `ENABLE/FORCE ROW LEVEL SECURITY`,
- active policies and grants,
- worker context setup,
- recent migrations.

## Recovery

Correct configuration or code in non-production first. Rotate compromised credentials where applicable. Reopen only after positive and negative isolation tests pass.

## Verification

- own-tenant read/write succeeds,
- wrong tenant/location returns no rows or stable denial,
- insert/update `WITH CHECK` rejects mismatch,
- connection reuse does not retain prior scope,
- audit evidence is complete.

## Forbidden

- Disabling RLS to restore service.
- Using an owner/superuser role as routine workaround.
