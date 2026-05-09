# SANTIS OS — Safe Deletion Policy

## 1. No Blind Delete
Under no circumstances shall any code, script, configuration file, or branch be deleted based purely on assumptions, automated sweeps, merge status alone, or stale date alone.

---

## 2. Branch Classification States

All branches must be classified before any action is taken.

| State | Definition |
| :--- | :--- |
| **KEEP** | Canonical or actively used branch. Must not be touched. |
| **REVIEW** | Insufficient evidence to classify further. Default state when any criterion is unknown. |
| **ARCHIVE-CANDIDATE** | Not active, not ready for deletion, but holds historical, governance, audit, or recovery value. |
| **DELETE-CANDIDATE** | All 5 deletion criteria are proven true with evidence. Requires Boardroom approval before execution. |

> **Default Rule:** When in doubt, classify as REVIEW. Never assume DELETE-CANDIDATE.

---

## 3. Five-Criteria Branch Deletion Formula

A branch may only be marked **DELETE-CANDIDATE** if **all five criteria** are simultaneously true and proven with evidence:

| # | Criterion | Definition |
| :--- | :--- | :--- |
| 1 | **merged** | The branch is fully merged into `main` or `develop`. Verified via `git branch -r --merged`. |
| 2 | **stale** | The last commit on the branch is older than the defined staleness threshold (default: 30 days). |
| 3 | **no active reference** | There is no open PR, open issue, active downstream branch dependency, or known task reference pointing to this branch. |
| 4 | **no deployment dependency** | The branch is not used by Vercel preview deployments, CI workflows, GitHub Actions triggers, deployment automation, or environment configuration. |
| 5 | **no governance value** | The branch does not preserve audit trails, migration history, incident-response records, historical architecture decisions, or recovery checkpoints. |

### Formula

```
merged ✅
+ stale ✅
+ no active reference ✅
+ no deployment dependency ✅
+ no governance value ✅
─────────────────────────────
= DELETE-CANDIDATE
```

> **If any single criterion is unknown or unverifiable → classify as REVIEW, not DELETE-CANDIDATE.**

---

## 4. Absolute Rules

### Rule A: Merge status alone is never enough for deletion.
A branch merged into `main` retains its commit history only as long as the remote ref exists. Deletion removes the ref permanently. Merge status proves the code is safe, not that the branch is disposable.

### Rule B: Stale date alone is never enough for deletion.
A branch with an old last-commit date may still hold deployment references, open PRs, or governance value. Age is one signal, not a verdict.

### Rule C: `copilot/*` branches require the same 5-criteria validation before deletion.
GitHub Copilot bot-generated branches are not exempt from this policy. Even if they appear automated and redundant, each `copilot/*` branch must pass all 5 criteria before being marked DELETE-CANDIDATE.

---

## 5. File-Level Deletion Policy

Before any **file** is deleted, it must be classified into one of the following states:

| State | Definition |
| :--- | :--- |
| **Alive** | Actively imported, executed, or served in production or development. |
| **Dormant** | Not actively used but maintained for compatibility, legacy fallback, or pending integration. |
| **Dead** | Proven to be fully unreferenced, inaccessible, or replaced by a canonical system. |
| **Unknown** | Purpose or integration points cannot be definitively proven. |

> **Unknown files are never deleted.** Classify first, act second.

---

## 6. Quarantine-First Policy

Files or branches classified as **Dead** or **DELETE-CANDIDATE** must not be removed immediately.

1. Move files to `_archive/` quarantine directory (if `.gitignore` permits).
2. For branches: document the deletion intent in a `chore/branch-cleanup-*` PR before executing.
3. Validate with `pnpm run audit:all` and full build after any quarantine action.
4. Wait for explicit **Boardroom approval** before permanent deletion.

---

## 7. Production-Grade Files and Branches

Any file or branch residing in or directly affecting:

- `spaos-core/`
- `components/`
- `server/`
- `apps/`
- `packages/`
- `main` branch
- `develop` branch

...requires **explicit human Boardroom approval** before any quarantine or deletion step.

---

## 8. Current Dead-Code Candidates (Phase 0 Validation)

The following files have been identified as dead-code candidates based on Phase 0 audit evidence. They are **not yet deleted**. Quarantine-first policy applies.

| File | Evidence | Status |
| :--- | :--- | :--- |
| `server/services/vip-risk-heuristic.js` | `// ⚠️ LEGACY COMPAT LAYER` header. Zero import references found. | Dead-Candidate |
| `server/services/ritual-recommendation-heuristic.js` | `// ⚠️ LEGACY COMPAT LAYER` header. Zero import references found. | Dead-Candidate |
| `scripts/cjs_to_esm_codemod.py` | ESM migration complete (`type: "module"` in package.json). No active invocation. | Dead-Candidate |

---

## 9. Evidence Log Requirement

Every DELETE-CANDIDATE classification must be accompanied by:

- `git branch -r --merged origin/main` output confirming merge
- `git for-each-ref` output confirming staleness date
- PR/issue search confirming no active reference
- CI/Vercel config scan confirming no deployment dependency
- Governance review confirming no historical value
- Boardroom approval timestamp
