# SANTIS Project Separation Decision Form

```text
STATUS              = APPROVED — OPTION B
PROGRAM_AUTHORITY   = HAKAN
PACKAGE             = PAKET_SEP_4
```

## Decision 1 — Contract Ownership

```text
[ ] OPTION A — Move existing packages intact under SANTIS_OS ownership
[x] OPTION B — Split pure contracts/validators from OS runtime (APPROVED)
[ ] OPTION C — Keep physical packages in SANTIS_WEB temporarily

SELECTED_OPTION = B
CONDITIONS      = PAKET_IMP_1 local implementation only; no push, PR, merge, deployment, production, or SANTIS_OS_CORE creation
```

## Decision 2 — Repository Creation Eligibility

```text
[ ] DESIGN ACCEPTED — creation remains separately authorized
[ ] DESIGN REVISION REQUIRED
[ ] HOLD

PRIVATE_REPO_CREATION_AUTHORITY = NOT GRANTED
```

## Migration Candidate Classes

### PROPOSED_MIGRATION_CANDIDATES

These are proposal groups, not an exact authorized migration manifest:

- `api/` and operational `app/` API/backend paths
- `packages/application/`
- `packages/database/`
- `packages/domain/`
- `packages/sovereign-bus/`
- `packages/openr/`
- `packages/ai-router/`
- `packages/runtime-guard/`
- `packages/quality-gate/`
- `scripts/ops/`
- `docker/postgres/` and `docs/db/`
- `services/ai-review-evidence/` — ownership review required because it is CI/governance infrastructure
- runtime portions now isolated in `packages/domain-runtime/`

```text
PROPOSED_CANDIDATE_SOURCE = 124 OS_ONLY_CANDIDATE FILES
MIGRATION_AUTHORITY       = NONE
```

### EXCLUDED_FROM_MIGRATION

- 2,240 `WEB_ONLY` files remain SANTIS_WEB responsibilities.
- 664 existing ARCHIVE files remain preserved in place; archive status does not create deletion eligibility.
- Contract-only portions intended for published packages are not treated as OS runtime migration until ownership is decided.

### REQUIRES_FURTHER_EVIDENCE

- All 989 remaining UNKNOWN files
- Exact split lines/exports for mixed `domain-schema` files
- Registry and package-release ownership
- Remote secret presence and scope
- Remote production/deployment reach
- Final consumer compatibility and rollback evidence

```text
MIGRATION_CANDIDATE_CLASSES = 3 / 3
EXACT_MIGRATION_MANIFEST    = NOT ELIGIBLE
```

## Decision Conditions

```text
GOVERNANCE_DECISION              = APPROVED — OPTION B
OPTION_B_CANONICAL_PROMOTION     = GRANTED — PAKET_IMP_1 LOCAL IMPLEMENTATION ONLY
PRIVATE_REPO_CREATION            = NOT GRANTED
FILE_MOVE                        = GRANTED — VALIDATION-SAFE FILES WITHIN PAKET_IMP_1 REMEDIATION ONLY
SECRET_MUTATION                  = NOT GRANTED
LOCAL_CODE_MUTATION              = GRANTED — PAKET_IMP_1 + REMEDIATION ONLY
LOCAL_COMMIT                     = GRANTED — BOUNDED PACKAGE COMMITS ONLY
PUSH / PR / MERGE                = NOT GRANTED
DEPLOYMENT / PRODUCTION          = NOT GRANTED
```

## Signature

```text
DECIDED_BY       = HAKAN
DECISION_DATE    = 2026-08-20
DECISION         = APPROVED — OPTION B
CONDITIONS       = LOCAL IMPLEMENTATION ONLY; REMOTE AND PRODUCTION AUTHORITIES NOT GRANTED
EVIDENCE_VERSION = PAKET_SEP_1–4
```
