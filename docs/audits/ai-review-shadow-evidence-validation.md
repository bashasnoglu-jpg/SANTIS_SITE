# AI Review Shadow Evidence — Validation Report

Date: 2026-08-02
Branch: `feature/ai-review-shadow-evidence`
Target: `develop`
Deployment: NOT PERFORMED

## Result

The isolated Shadow Evidence API and GitHub workflow controls are ready for
Draft PR review. This result does not authorize deployment, Airtable writes,
human-review status mutation, or production use.

## Passed checks

| Check | Result |
| --- | --- |
| Service unit and contract tests | PASS — 14/14 |
| Service TypeScript typecheck | PASS |
| Service TypeScript build | PASS |
| Repository lint | PASS |
| Repository typecheck | PASS |
| Sovereign Guard — repository | PASS |
| Sovereign Guard — new service files | PASS |
| Runtime contract audit | PASS |
| Workflow YAML parsing | PASS |
| Workflow action SHA pinning | PASS |
| Workflow dangerous-pattern scan | PASS |
| Git whitespace check | PASS |

## Security assertions verified

- No `pull_request_target` trigger.
- Prepare workflow checks out the trusted base SHA, not pull-request code.
- Fork identity is recorded and denied before Google authentication.
- Workload Identity Federation is the only Google authentication path.
- GitHub Actions are pinned to full commit SHAs.
- Diff size and file count are bounded.
- `.aiignore` applies a deny-first sensitive path policy.
- Private keys and common GitHub, Google, Airtable, AWS, Stripe, bearer, and
  JWT credential forms are redacted before model input.
- Requests, model output, evidence, and signatures use Zod contracts.
- Evidence status is fixed to `NON_BINDING / NOT_EVALUATED`.
- Airtable projection is absent.
- Cloud Run deployment is absent.

## Environment limitation

The aggregate `audit:all` command stopped at the existing environment audit
because the execution host provides Node 24 and a system pnpm 11, while the
repository requires Node 20 and pnpm 10.24. The implementation-specific checks
were rerun with pnpm 10.24 and passed. CI on the repository-pinned Node version
remains the authoritative environment verification.

## Remaining gates

1. Independent Draft PR review.
2. CI on the pushed feature branch.
3. Separate Boardroom approval before any Cloud Run deployment.
4. Secret Manager signing-key creation and secret-level IAM.
5. Private Cloud Run invoker binding and maximum-instance verification.
6. Controlled end-to-end Shadow Mode evidence run.
