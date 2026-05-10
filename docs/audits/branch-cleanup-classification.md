# SANTIS OS — Branch Cleanup Classification

## Status

Classification only.  
No delete. No archive. No refactor.

## Branch Audit Table

| Branch / Pattern | Type | Status | Action |
| :--- | :--- | :--- | :--- |
| `main` | canonical | active / protected | keep |
| `develop` | canonical | active / integration | keep |
| `phase-f-build-warning-zero-baseline` | phase branch | merged / historical baseline | keep (baseline reference) |
| `docs/branch-cleanup-inventory` | docs audit | merged docs branch | delete candidate after review |
| `docs/*` (drift/inventory) | docs audit | merged / stale | delete candidate (merged into main) |
| `phase-84-replay-temporal-oracle` | phase branch | unmerged | review |
| `phase-85/entanglement-map` | phase branch | unmerged | review |
| `phase-e-prod-deployment-readiness-seal` | phase branch | unmerged | review before cleanup |
| `feat/boardroom-*` | feature | merged | delete candidate |
| `feat/core-state-sse-feedback-loop` | feature | merged | delete candidate (after final check) |
| `fix/*` | fix | merged | delete candidate |
| `copilot/*` | generated | merged / stale | bulk delete candidate |
| `archive/phase-*` | archive | stale | keep per policy |
| `tech-debt/dna-guard-expansion` | technical debt | unmerged | review |

## Governance

This PR establishes the branch classification baseline. 
**No branch deletion is authorized by this PR.**
Any cleanup must happen in a later controlled branch after explicit **controlled deletion authorization**.

## Verification

- Classification based on PR #170 and #171 merge status.
- No delete / no archive / no refactor.
