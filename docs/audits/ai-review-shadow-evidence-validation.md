# AI Review Shadow Evidence — Validation Report

Date: 2026-08-02
Branch: `feature/ai-review-shadow-evidence`
Target: `develop`
Deployment: PRIVATE SHADOW INFRASTRUCTURE DEPLOYED; ACTIVATION DISABLED

## Result

The isolated Shadow Evidence API is deployed privately with activation disabled.
Second-pass remediation keeps the PR in Draft and does not authorize endpoint
activation, Gemini execution, Airtable writes, human-review status mutation,
merge, or production use.

## Passed checks

| Check | Result |
| --- | --- |
| Service unit and contract tests | PASS — 22/22 |
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
- Diff size and file count are bounded; excess or truncated input is rejected.
- Artifact provenance is bound to the triggering workflow run, PR, repository,
  base SHA, head SHA, digest, and included-file count before Google authentication.
- Evaluation requires a dedicated caller service-account variable and cannot use
  the deployment service-account variable.
- Returned evidence is checked for non-binding status and request provenance before upload.
- `.aiignore` applies a deny-first sensitive path policy.
- Private keys and common GitHub, Google, Airtable, AWS, Stripe, bearer, and
  JWT credential forms are redacted before model input.
- Requests, model output, evidence, and signatures use Zod contracts.
- Evidence status is fixed to `NON_BINDING / NOT_EVALUATED`.
- Airtable projection is absent.
- Private Cloud Run exists with no unauthenticated invoker.

## Deployment reality lock

| Boundary | Verified state |
| --- | --- |
| Service | `santis-ai-evidence-api` |
| Region | `europe-west1` |
| Ready revision | `santis-ai-evidence-api-00002-fds` |
| Image digest | `sha256:fb67f966bdfe1cdafd43b0382be001cbf2ee0fa2fc29f998c7d2efff2000c53c` |
| Runtime service account | `santis-ai-evidence@santis-ai-review.iam.gserviceaccount.com` |
| Scaling | min 0 / max 1 / concurrency 1 |
| Public access | None |
| Activation URL variable | Unset |
| Dedicated evidence caller | Not yet provisioned/configured |
| GitHub WIF end-to-end | Not verified |
| Gemini Shadow call | Not executed |

The second-pass remediation changes repository code, tests, workflows, and these
governance records only. It does not update the deployed Cloud Run service.

## Validation environment

Second-pass service tests, typecheck, and build were executed with Node 20.19.5
and pnpm 10.24.0. Feature-branch CI on the pushed head remains the authoritative
remote verification.

## Remaining gates

1. CI on the corrected feature-branch head using repository-pinned Node 20 and pnpm 10.24.
2. Independent review of the second-pass corrections.
3. Dedicated evidence caller service account with only `roles/run.invoker`.
4. WIF trust binding for that caller without deployment or artifact-write authority.
5. Separate activation approval before setting `GCP_EVIDENCE_API_URL`.
6. Separately approved controlled end-to-end Shadow Mode evidence run.
