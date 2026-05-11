## Summary

Describe the change in one or two sentences.

## Scope

- [ ] Runtime code
- [ ] Documentation only
- [ ] Governance / audit only
- [ ] Build / CI / tooling
- [ ] Security hardening

## Reality Lock Checklist

- [ ] I verified the changed files match the stated scope.
- [ ] I avoided unrelated refactors.
- [ ] I did not delete files directly; quarantine/deletion policy was followed where applicable.
- [ ] I updated relevant audit or governance docs when needed.

## Verification

List the commands run and their result.

```text
pnpm run stitch:enforce
pnpm run lint
pnpm run test:e2e -- --project=chromium tests/e2e/reservation.spec.ts
```

## Risk Notes

Document any known risks, follow-up work, or intentionally deferred items.

## Governance

Rule 5: ACTIVE
