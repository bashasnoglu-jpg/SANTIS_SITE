# Santis AI Review — Shadow Evidence Plan

Status: BOARDROOM APPROVED FOR MODE 4 IMPLEMENTATION
Target branch: `develop`
Feature branch: `feature/ai-review-shadow-evidence`
Deployment authorization: NOT GRANTED

## Objective

Introduce a zero-trust, non-binding AI pre-review path for GitHub pull requests.
The path prepares a bounded and sanitized diff, evaluates it with Gemini through
Google Cloud Workload Identity Federation, and emits machine-readable evidence.
It must never replace human verification or mutate a governance gate.

## Canonical flow

```text
GitHub PR diff
  -> prepare workflow
  -> .aiignore and secret redaction
  -> bounded JSON artifact
  -> evaluate workflow
  -> private Shadow Evidence API
  -> Gemini review
  -> NON_BINDING / NOT_EVALUATED evidence artifact
```

## Change scope

- Add `services/ai-review-evidence` as an isolated Node.js/TypeScript service.
- Validate every request, response, model output, and evidence record with Zod.
- Add deterministic redaction and diff-boundary enforcement.
- Add `.aiignore` with deny-first sensitive path rules.
- Add separate prepare and evaluate GitHub Actions workflows.
- Add unit and contract tests for malformed inputs, redaction, ignored paths,
  fork handling, evidence status invariants, and fail-closed Shadow Mode.
- Add a container definition for a future private Cloud Run deployment.

## Security invariants

1. No service-account key or long-lived Google credential.
2. GitHub OIDC may authenticate only through the approved WIF provider.
3. Fork pull requests never receive Google Cloud credentials.
4. The service accepts only `AI_REVIEW_MODE=shadow`.
5. Evidence always declares `binding_status=NON_BINDING` and
   `human_review_status=NOT_EVALUATED`.
6. AI output cannot set `PASS`, `FAIL`, `Verified`, `Failed`, or a gate.
7. The first implementation does not write to Airtable.
8. Malformed or oversized inputs fail closed.
9. Cloud Run deployment is not part of this change.

## Validation gates

- Service unit and contract tests pass.
- Service TypeScript compilation passes.
- Workflow YAML parses and satisfies permissions/event assertions.
- Repository governance scanner passes for changed code.
- Git diff contains no credential material.
- Draft PR remains non-deploying and targets `develop`.

## Deferred work

- Private Cloud Run deployment and invoker binding.
- Secret Manager entries for evidence signing or downstream projection.
- Airtable projection and reconciliation.
- Human review UI and gate integration.
- Production enablement, quotas, SLOs, and retention policy.
