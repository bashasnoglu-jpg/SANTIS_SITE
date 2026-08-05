# Santis AI Review — Shadow Evidence Plan

Status: DRAFT — FINAL REVIEW REMEDIATION IN PROGRESS
Target branch: `develop`
Feature branch: `feature/ai-review-shadow-evidence`
Deployment authorization: PRIVATE SHADOW INFRASTRUCTURE ONLY — COMPLETED

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
- Maintain the isolated container definition used by the approved private Cloud Run deployment.

## Security invariants

1. No service-account key or long-lived Google credential.
2. GitHub OIDC may authenticate only through the approved WIF provider.
3. Fork pull requests never receive Google Cloud credentials.
4. The service accepts only `AI_REVIEW_MODE=shadow`.
5. Evidence always declares `binding_status=NON_BINDING` and
   `human_review_status=NOT_EVALUATED`.
6. AI output cannot set `PASS`, `FAIL`, `Verified`, `Failed`, or a gate.
7. The first implementation does not write to Airtable.
8. Malformed, oversized, truncated, or provenance-mismatched inputs fail closed.
9. Evaluation uses a dedicated caller service account with only private API invocation authority;
   it must not use the deployment service account.
10. The deployed private Cloud Run service remains activation-disabled until independent review,
    dedicated caller IAM, and controlled end-to-end approval are complete.
11. Preparation executes only the trusted-base script. If that script is absent during initial
    bootstrap, the workflow succeeds with an explicit skip and emits no input artifact.

## Validation gates

- Service unit and contract tests pass.
- Service TypeScript compilation passes.
- Workflow YAML parses and satisfies permissions/event assertions.
- Repository governance scanner passes for changed code.
- Git diff contains no credential material.
- Draft PR targets `develop`; this remediation must not mutate the existing deployment.

## Deployed private infrastructure

- Service: `santis-ai-evidence-api`
- Region: `europe-west1`
- Ready revision: `santis-ai-evidence-api-00002-fds`
- Image digest: `sha256:fb67f966bdfe1cdafd43b0382be001cbf2ee0fa2fc29f998c7d2efff2000c53c`
- Runtime identity: `santis-ai-evidence@santis-ai-review.iam.gserviceaccount.com`
- Scaling boundary: minimum 0, maximum 1, concurrency 1
- Access: private; no unauthenticated invoker
- Activation: `GCP_EVIDENCE_API_URL` unset
- Gemini Shadow execution: not performed
- Dedicated caller: `santis-ai-evidence-caller@santis-ai-review.iam.gserviceaccount.com`
- Caller authority: `roles/run.invoker` on this Cloud Run service only; no project-level roles
- WIF scope: repository/owner-bound `workflow_run` for
  `ai-pre-review-evaluate.yml@refs/heads/develop`

This deployed infrastructure predates the second-pass remediation commit and is not changed by it.

## Remaining activation gates

The dedicated caller, Cloud Run invoker binding, workflow-specific WIF binding, and
`GCP_EVIDENCE_CALLER_SERVICE_ACCOUNT` variable are configured. The former deployment identity
is not a Cloud Run invoker. Activation remains disabled because `GCP_EVIDENCE_API_URL` is unset.

Before activation, complete independent review and obtain separate approval to set the endpoint
URL and run a controlled WIF end-to-end Shadow acceptance. Do not expose the deployment service
account to the evaluation workflow.

## Deferred work

- Activation URL and controlled WIF end-to-end acceptance.
- Independent signature verification or downstream projection.
- Airtable projection and reconciliation.
- Human review UI and gate integration.
- Production enablement, quotas, SLOs, and retention policy.
