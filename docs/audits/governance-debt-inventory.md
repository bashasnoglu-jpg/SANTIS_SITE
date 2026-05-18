# SANTIS OS — Governance Debt Inventory

## Status

Documentation-only audit.  
No workflow rewrite. No branch protection mutation. No CODEOWNERS enforcement yet. No PR template enforcement yet.

## Core Finding

Santis OS has strong governance documentation, but incomplete repository-level enforcement. The issue is not lack of rules, but that rules are not yet consistently encoded as automatic GitHub barriers.

### 1. Policy Exists, Enforcement Is Incomplete
`docs/governance/` contains governance policy material such as branch flow, deletion policy, and agent governance. However, several repository-level enforcement mechanisms are missing or require verification:
- PR template
- CODEOWNERS
- CONTRIBUTING.md
- SECURITY.md
- Required status checks
- Branch protection rules
- Review authority mapping

### 2. PR Format Is Manual
There is no canonical PR template enforcing phase name, scope, risk classification, gates run, and affected surfaces. This creates review drift.

### 3. Review Authority Is Manual
There is no confirmed CODEOWNERS file. High-risk surfaces (runtime, design system, governance docs, workflows, deployment config) do not automatically request required reviewers.

### 4. CI Gates Exist But Blocking Status Is Unclear
`.github/workflows/` contains active workflows, but the documentation lacks a clear required-check matrix distinguishing between informational checks and blocking deployment gates.

## Classification

| Surface | Classification | Reason |
|---|---|---|
| `docs/governance/` | ✅ ALIVE / policy source | Governance exists as documentation |
| `.github/workflows/` | ✅ ALIVE / fragmented gates | Active CI exists but blocking map unclear |
| `.github/PULL_REQUEST_TEMPLATE.md` | ❌ MISSING | PR quality gate is manual |
| `.github/CODEOWNERS` | ❌ MISSING | Review authority not encoded |
| `CONTRIBUTING.md` | ❌ MISSING | Contributor contract absent |
| `SECURITY.md` | ❌ MISSING | Security disclosure path absent |
| Branch protection rules | 🔍 REVIEW REQUIRED | Must be verified in GitHub settings |
| Required checks | 🔍 REVIEW REQUIRED | Must be mapped to workflows |

## Recommended Implementation Phases

### Phase N1 — PR Governance Template
Create `.github/PULL_REQUEST_TEMPLATE.md` with deterministic fields (Summary, Scope, Risk, Verification, Rollback, Do-not-touch).

### Phase N2 — CODEOWNERS Authority Map
Create `.github/CODEOWNERS` mapping ownership for runtime, design-system, workflows, governance docs, and critical API surfaces.

### Phase N3 — Required Check Matrix
Document and configure required checks for `main` (lint, stitch:enforce, E2E, build gates).

### Phase N4 — Security and Contribution Contract
Add `CONTRIBUTING.md` and `SECURITY.md`.

## Do Not Do In This PR
- Do not edit workflows.
- Do not create CODEOWNERS yet.
- Do not add PR template yet.
- Do not mutate branch protection.
- Do not change CI behavior.

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli envanter ve yönetişim planıdır.** ✅
