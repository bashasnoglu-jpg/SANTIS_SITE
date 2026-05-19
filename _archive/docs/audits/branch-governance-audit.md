# SANTIS OS — Branch Governance Audit

**Audit Date:** 2026-05-08  
**Auditor:** Repo Governance Lead  
**Mode:** READ-ONLY. No branches deleted or renamed.  
**Branch Policy Reference:** `docs/governance/branch-policy.md`  
**Deletion Policy Reference:** `docs/governance/deletion-policy.md`

---

## Evidence Sources

| Source | Command Used |
| :--- | :--- |
| Merged into main | `git branch -r --merged origin/main` |
| Merged into develop | `git branch -r --merged origin/develop` |
| Stale dates | `git for-each-ref --sort=committerdate refs/remotes/origin` |
| Active PRs | `gh pr list --state open --limit 100 --json number,title,headRefName,baseRefName` |
| CI/Deployment dependency | `Get-ChildItem .github\workflows` + `vercel.json` scan |
| backup/* existence | `git branch -r | Select-String "backup"` → **No results** |

---

## Active PRs (Open — Active Reference Confirmed)

These branches have open Pull Requests. They cannot be DELETE-CANDIDATE regardless of merge or stale status.

| PR # | Branch | Title | Base | Classification |
| :--- | :--- | :--- | :--- | :--- |
| #147 | `vercel/install-and-configure-vercel-s-egcni5` | Install and configure Vercel Speed Insights | main | **KEEP until PR resolved** |
| #114 | `copilot/update-node-version-deprecation-warning` | fix: restore pnpm-lock.yaml and align packageManager | main | **KEEP until PR resolved** |
| #76 | `chore/architectural-sovereignty-seal` | chore: seal Santis OS architectural sovereignty layer | main | **KEEP until PR resolved** |
| #50 | `copilot/update-workflows-to-use-pnpm` | ci: enforce pnpm 9.1.0 as single source of truth | main | **KEEP until PR resolved** |
| #3 | `copilot/feat-consolidate-css-tokens` | feat: consolidate CSS font tokens + architecture contract | main | **KEEP until PR resolved** |
| #2 | `copilot/chore-stabilize-santis-identity-seo` | chore: stabilize Santis public site identity and SEO | main | **KEEP until PR resolved** |

---

## CI / Deployment Dependency Findings

| Finding | Evidence |
| :--- | :--- |
| CI workflows listen to `main` and `develop` only | `.github/workflows/` scan result |
| `vercel.json` contains no branch-specific routing | `vercel.json` scan: only headers/security config |
| `@vercel/speed-insights` is a **package dependency**, not a branch dependency | `pnpm-lock.yaml` reference |
| `node_modules/` workflow files are third-party, not Santis-owned | Excluded from analysis |
| `backup/*` branches do not exist | `git branch -r | Select-String "backup"` → empty |

**Conclusion:** No `phase-*`, `copilot/*`, `pr1/*`, or `pr2/*` branch is referenced in CI or Vercel config.

---

## Group Classification Tables

### Group A — `copilot/*` (Merged into main ✅, No open PR)

Criterion status for branches **NOT** in the active PR list above:

| Criterion | Status |
| :--- | :--- |
| merged | ✅ Confirmed via `--merged origin/main` |
| stale | ✅ All last commits between 2026-04-28 and 2026-05-06 (>2 days, threshold TBD) |
| no active reference | ✅ Not in open PR list |
| no deployment dependency | ✅ Not referenced in CI or vercel.json |
| no governance value | ❌ **Not yet evaluated** |

**Classification: REVIEW** — governance value criterion unproven. Cannot promote to DELETE-CANDIDATE yet.

> Once governance value is assessed per branch, eligible ones may be promoted to DELETE-CANDIDATE via a separate Boardroom-approved PR.

### Group B — `phase-*`

| Branch | Merged/Main | Last Commit (approx) | Open PR | Classification | Notes |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `phase-3-typography-canonicalization` | ❌ | 2026-05-08 | ❌ | **KEEP** | Active sprint branch |
| `phase-0-sovereign-constitution` | ❌ | Unknown | ❌ | **REVIEW** | Possible governance/historical value |
| `phase-2-lint-zero-warning-quality-seal` | ❌ | 2026-05-08 (recent) | ❌ | **REVIEW** | Recently active, may hold lint governance |
| `phase-82-visual-truth` | ❌ | Unknown | ❌ | **ARCHIVE-CANDIDATE** | Old sprint, no active work |
| `phase-83-boardroom-oracle-feed` | ❌ | Unknown | ❌ | **ARCHIVE-CANDIDATE** | Old sprint |
| `phase-84-live-oracle-stream` | ❌ | Unknown | ❌ | **ARCHIVE-CANDIDATE** | Old sprint |
| `phase-84-replay-temporal-oracle` | ❌ | Unknown | ❌ | **ARCHIVE-CANDIDATE** | Duplicate phase number |
| `phase-85/entanglement-map` | ✅ | Unknown | ❌ | **REVIEW** | Merged but governance value unknown |
| `phase/runtime-sovereign-guard` | ✅ | Unknown | ❌ | **REVIEW** | Non-standard prefix, merged |

### Group C — `vercel/*`

| Branch | Merged/Main | Open PR | Deployment Dep | Classification | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `vercel/install-and-configure-vercel-s-egcni5` | ❌ | ✅ PR #147 | Unknown | **KEEP** | Active PR — must not be touched |
| `vercel/install-vercel-speed-insights-pf5b6j` | ✅ | ❌ | ❌ | **REVIEW** | Merged, no PR. Governance value unproven |

### Group D — `pr1/*`, `pr2/*`

| Branch | Merged/Main | Open PR | Classification | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `pr1/zero-drift-foundation` | ✅ | ❌ | **REVIEW** | May hold migration history value |
| `pr2/migration-cleanup` | ❌ | ❌ | **REVIEW** | Not merged. Active reference unknown |
| `pr2/migration-cleanup-cleanbase` | ✅ | ❌ | **REVIEW** | Merged. Governance value unproven |

### Group E — `backup/*`

| Finding | Classification |
| :--- | :--- |
| No `backup/*` branches found remotely | N/A — does not exist |

### Group F — Canonical Branches with No Issues

| Branch | Merged/Main | Convention | Classification |
| :--- | :---: | :---: | :---: |
| `main` | canonical | ✅ | **KEEP** |
| `develop` | canonical | ✅ | **KEEP** |
| `refactor/reduce-homepage-css-entrypoints` | ✅ | ✅ | **REVIEW** |
| `refactor/ssot-packs` | ✅ | ✅ | **REVIEW** |
| `chore/architectural-sovereignty-seal` | ❌ | ✅ | **KEEP** (open PR #76) |

---

## Summary

| Classification | Count | Groups |
| :--- | :---: | :--- |
| **KEEP** | 9 | main, develop, phase-3, active PR branches (6) |
| **REVIEW** | ~100 | copilot/* (no PR), phase-*, vercel/*, pr1/pr2/*, refactor/* |
| **ARCHIVE-CANDIDATE** | 4 | phase-82, phase-83, phase-84, phase-84-replay |
| **DELETE-CANDIDATE** | 0 | Governance value criterion not yet proven for any branch |

---

## Governance Value Assessment — Next Step

Before any branch can be promoted from REVIEW to DELETE-CANDIDATE, the following must be documented per branch:

1. Does this branch contain commits not present in `main`?  
   → `git log origin/main..origin/<branch> --oneline`
2. Does this branch reference a past incident, architecture decision, or recovery event?
3. Was this branch associated with a closed PR that had significant discussion?

This assessment must be done **per group**, not per individual branch, to be efficient.

---

## Recommended Next Action

**Do not delete anything.**  
Open a separate `docs/*` PR to record this audit file, then schedule a Boardroom review for governance value assessment of `copilot/*` and `phase-*` groups.

```powershell
git add docs/audits/branch-governance-audit.md
git commit -m "docs: add branch governance audit with five-criteria classification"
git push
```
