# SANTIS OS — Agent Governance Policy

**Version:** Phase 0.5  
**Last Updated:** 2026-05-08  
**Source of Truth:** `AGENTS.md` + `.agents/rules/*.md`

---

## 1. Applies To

This document governs all AI coding agents operating within the Santis OS repository:
- Antigravity (Google DeepMind)
- GitHub Copilot
- OpenAI Codex
- Any future agent

---

## 2. Operating Modes

All agents must declare and operate strictly within one of the following modes. An agent must never escalate its own mode without explicit user instruction.

### MODE 1 — READ-ONLY AUDIT MODE
**Purpose:** Inspect, classify, measure, and report repository state.

| Allowed | Forbidden |
| :--- | :--- |
| Read files | Create files |
| Run read-only git commands | Modify files |
| Classify branches/files | Delete files |
| Produce audit tables | Branch operations |
| Measure drift | Any write operation |

### MODE 2 — SAFE DOCS-ONLY MODE
**Purpose:** Create or update governance and documentation files only.

| Allowed | Forbidden |
| :--- | :--- |
| Create/edit `docs/*.md` | Edit application code |
| Create/edit `AGENTS.md` | Edit UI files |
| Create/edit `.agents/rules/*.md` | Edit package files |
| Create/edit `.agents/context/*.md` | Edit CI/CD configs |
| | Branch operations |
| | Dependency install |

### MODE 3 — SAFE QUARANTINE MODE
**Purpose:** Move Dead-classified files to quarantine only.

| Allowed | Forbidden |
| :--- | :--- |
| Move files to `_archive/` | Delete files permanently |
| Create `.gitkeep` markers | Rename branches |
| Add quarantine log entries | Push without review |

**Prerequisites:**
1. Prior READ-ONLY AUDIT with classification evidence.
2. Explicit Boardroom approval.
3. Build/test validation plan ready.

### MODE 4 — CODE CHANGE MODE
**Purpose:** Modify application code, UI, packages, or build configuration.

| Allowed | Forbidden |
| :--- | :--- |
| Edit `.html`, `.tsx`, `.ts`, `.js` files (approved scope) | Direct push to `main` |
| Edit `packages/` (approved scope) | Force push (`git push -f`) |
| Run governance scanner after changes | Skip planning artifact |
| | Auto-install dependencies |

**Prerequisites:**
1. Explicit Boardroom task approval with defined scope.
2. Plan artifact produced before first edit.
3. Governance scanner run after changes.

---

## 3. Branch Deletion Formula

A branch may only be marked **DELETE-CANDIDATE** when **all five criteria** are proven with evidence:

```
merged ✅
+ stale ✅
+ no active reference ✅
+ no deployment dependency ✅
+ no governance value ✅
= DELETE-CANDIDATE
```

| Rule | Definition |
| :--- | :--- |
| merged | Verified via `git branch -r --merged origin/main` |
| stale | Last commit older than defined threshold |
| no active reference | No open PR, issue, or downstream dependency |
| no deployment dependency | Not referenced in CI workflows or Vercel config |
| no governance value | No audit, migration, or recovery value |

**Non-negotiable rules:**
- Merge status alone is never enough for deletion.
- Stale date alone is never enough for deletion.
- `copilot/*` branches require the same 5-criteria validation.
- Open PR branches are never DELETE-CANDIDATE.
- Any unknown branch defaults to **REVIEW**.

Full policy: `docs/governance/deletion-policy.md`

---

## 4. File Classification States

| State | Definition | Action |
| :--- | :--- | :--- |
| **Alive** | Actively imported or executed | No action |
| **Dormant** | Not used but may have recovery value | No action |
| **Dead** | Proven unreferenced, replaced | Quarantine (MODE 3) |
| **Unknown** | Cannot be definitively classified | REVIEW — never delete |

---

## 5. Canonical Engineering Rules

| Rule | Standard |
| :--- | :--- |
| Package manager | `pnpm` only. No `npm`, `yarn`, `bun`. |
| Lockfile | `pnpm-lock.yaml` only. `package-lock.json` is forbidden. |
| State management | CoreState SSOT. No Zustand, Redux without Boardroom approval. |
| Design tokens | Canonical tokens only. No arbitrary Tailwind values without approval. |
| Inline colors | Forbidden. Use design system tokens. |
| Branch strategy | `main` (production) → `develop` (integration) → `feature/*`, `fix/*`, etc. |
| PR target | All PRs target `develop`, not `main` (except `hotfix/*`). |
| Push to main | Never directly. PRs only. |
| Force push | Never. |

---

## 6. Boardroom Approval Required For

- Deployment
- Database migrations
- Security changes
- Pricing or payment logic
- Dependency replacement or addition
- Permanent file or branch deletion
- Direct push or force push
- Any deviation from canonical stack
- UI pattern changes affecting Quiet Luxury aesthetic
- P0 architectural violations (Zustand, Prisma, etc.)

---

## 7. Governance Document Map

| Area | Document |
| :--- | :--- |
| Git Flow | `docs/governance/git-flow.md` |
| Branch Policy | `docs/governance/branch-policy.md` |
| Deletion Policy | `docs/governance/deletion-policy.md` |
| Agent Governance | `docs/governance/agent-governance.md` |
| Phase 0 Audit | `docs/audits/phase-0-reality-lock.md` |
| Branch Audit | `docs/audits/branch-governance-audit.md` |
| CoreState Rules | `.agents/rules/CoreStateSSOT.md` |
| Quiet Luxury Rules | `.agents/rules/QuietLuxury.md` |
| Runtime Contracts | `.agents/rules/RuntimeContracts.md` |
| Zero Tech Debt | `.agents/rules/ZeroTechnicalDebt.md` |
