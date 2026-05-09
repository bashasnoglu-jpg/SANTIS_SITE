# SANTIS OS — Phase 0 Reality Lock Audit

## 1. Executive Summary
This document serves as the canonical record of the Santis OS repository state during the Phase 0 Reality Lock. It establishes a baseline of the current technical debt, branch architecture, and dead code candidates without making destructive changes. The ultimate goal is to stabilize the repository and enforce strict governance policies moving forward.

## 2. Validated Findings
| Area | Finding | Confidence |
| :--- | :--- | :--- |
| **Branch Architecture** | `develop` branch is missing. | High |
| **Package Management** | `pnpm` is the canonical package manager. | High |
| **Design Drift** | Hardcoded `#D4AF37` Tailwind/color drift exists. | High |
| **Duplicate UI** | `navbar.html` and `navbar-en.html` are duplicate UI systems. | High |
| **Duplicate UI** | `footer.html` and `footer-en.html` are likely duplicate UI systems. | High |
| **Dead Code** | `server/services/vip-risk-heuristic.js` is a dead-code candidate. | High |
| **Dead Code** | `server/services/ritual-recommendation-heuristic.js` is a dead-code candidate. | High |
| **Dead Code** | `scripts/cjs_to_esm_codemod.py` is a dead tooling candidate. | High |

## 3. Weakened Claims
| Claim | Adjustment | Reason |
| :--- | :--- | :--- |
| **Zustand Violation** | Treat as isolated local state. | Not a critical architecture violation of CoreState unless proven otherwise. |
| **api-mock.ts Dead Code** | Treat as dev/test dependency. | Contains active references for local environment mock simulation. |
| **Python Scripts Dead** | Classify individually. | Some are active reporting/generator tools, not all are dead. |

## 4. Rejected Claims
| Claim | Rejection Reason |
| :--- | :--- |
| **Blind Script Deletion** | We cannot assume all `.py` files are dead; each must be proven inactive. |

## 5. Still Unknown
| Area | Unknown Status | Next Check Required |
| :--- | :--- | :--- |
| **Working Tree Cleanliness** | Relies on manual user checks. | Requires final local `git status --short` verification before executing PRs. |

## 6. Technical Debt Register
| ID | Category | Description | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| TD-01 | UI Duplication | Language-based duplication of header/footer components. | High | Awaiting Resolution |
| TD-02 | Color Drift | Arbitrary inline Tailwind colors (e.g., `#D4AF37`). | Medium | Awaiting Resolution |
| TD-03 | Git Governance | Absence of `develop` branch and non-standard branch prefixes. | Medium | Awaiting Resolution |

## 7. Dead Code Candidates
| Candidate Path | Status | Recommendation |
| :--- | :--- | :--- |
| `server/services/vip-risk-heuristic.js` | Dead-Candidate | Quarantine into `_archive/phase-0-dead-code/` (pending PR). |
| `server/services/ritual-recommendation-heuristic.js` | Dead-Candidate | Quarantine into `_archive/phase-0-dead-code/` (pending PR). |
| `scripts/cjs_to_esm_codemod.py` | Dead-Candidate | Quarantine into `_archive/phase-0-dead-code/` (pending PR). |

## 8. Duplicate UI Systems
| Component Type | Duplicate Paths | Risk |
| :--- | :--- | :--- |
| **Navigation** | `components/navbar.html`, `components/navbar-en.html` | SSOT violation, maintenance drift. |
| **Footer** | `components/footer.html`, `components/footer-en.html` | SSOT violation, maintenance drift. |

## 9. Design Token Drift
| Property | Value | Instances Found | Action Required |
| :--- | :--- | :--- | :--- |
| **Color** | `#D4AF37` | 200+ | Canonicalize via design system token (`gold` or `brand`). |

## 10. Git Flow Risks
| Risk Area | Description | Impact |
| :--- | :--- | :--- |
| **Integration Flow** | Missing `develop` branch for staging environment. | Features might hit `main` untested. |
| **Naming Conventions** | Wildcard branches like `phase-85`, `vercel`, `tech-debt` exist. | Cluttered history, breaks automated CI hooks. |

## 11. Safe Cleanup Plan
1. **Classify:** Identify files as Alive, Dormant, Dead, or Unknown.
2. **Quarantine:** Move Dead/Dormant files to `_archive/phase-0-dead-code/`.
3. **Build/Test:** Run `pnpm run audit:all` to ensure no active code was broken.
4. **Verify:** Check manual paths and governance limits.
5. **Delete:** Permanently remove quarantine directory *only* after explicit Boardroom approval.
6. **Document:** Commit the outcome.

## 12. Phase 0 Exit Criteria
- Reality Lock documentation generated.
- Git flow and deletion policies formally established in `docs/governance/`.
- Quarantine folder structure initialized (`_archive/`).
- Initial governance PR merged.

## 13. Next PR Recommendation
**PR Title:** `chore: establish phase 0 reality lock governance`
**Scope:** Commits the current baseline documents without modifying application code.
