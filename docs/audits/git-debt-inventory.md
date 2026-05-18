# SANTIS OS — Git Debt Inventory

## Status

Documentation-only audit.  
No branch deletion. No remote pruning. No ref rewrite. No tag mutation.

## Core Finding

The repository does not currently have a fully sealed branch lifecycle policy. The issue is not "bad branches", but **"branch lifecycle drift"**.

### 1. Lifecycle Drift
- Sealed phase branches (e.g., `phase-0` to `phase-4`) remain visible after being merged.
- Stale feature branches require review for owner, PR, and merge-state before retirement.
- Tags are correctly used as seal artifacts, but branch retirement is not yet standardized.

### 2. Direct Commit Drift
- Direct commits on `main` have occurred during emergency governance recovery or rapid documentation updates, bypassing the PR-only governance rule.

### 3. Naming Inconsistency
- Branch naming conventions vary across `phase-*`, `feat/*`, `fix/*`, and `archive/*`.

## Classification

| Surface | Classification | Reason |
|---|---|---|
| `main` | ✅ ALIVE / Production SSOT | Canonical source of truth |
| `develop` | 🔍 REVIEW REQUIRED | Role must be confirmed for active strategy |
| `phase-*` | 🔍 REVIEW REQUIRED / lifecycle drift | Merge/tag state must be verified before pruning |
| `feat/*` | 🔍 REVIEW REQUIRED | Could contain unmerged or abandoned work |
| `fix/*` | 🔍 REVIEW REQUIRED | Potential stale fixes or unclosed PRs |
| `archive/*` | ✅ ALIVE / historical archive | Should be retained per policy |
| Tags / seal refs | ✅ ALIVE / immutable governance artifacts | Correct long-term audit mechanism |
| Direct commits on `main` | ⚠️ DRIFT | Bypasses standard Git flow |
| Mixed branch naming | ⚠️ DRIFT | Lack of consistent naming policy |

## Branch Retirement Rules

No branch should be retired (deleted) until all the following are true:
1. Branch is merged into `main`, or its work is intentionally abandoned.
2. No open PR depends on it.
3. No linked issue requires it.
4. No untagged release/seal information exists only on that branch.
5. Owner or governance lead approves retirement.
6. A backup reference or tag exists if historical retention is required.

## Recommended Next Steps

### Phase M — Branch Lifecycle Governance
- Define a unified branch naming standard.
- Define a formal branch retirement policy.
- Classify all existing remote branches into: active, merged/sealed, stale-review, archive-retain, and delete-candidate.

## Do Not Touch
- `main`
- Active PR branches
- `archive/*`
- Any branch with unmerged commits
- Any tag / seal ref

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli envanter ve yönetişim planıdır.** ✅
