# Santis OS - GitHub Repository Technical Debt Report

## 1. Branch Entropy (Git Debt)
Santis OS follows a Zero Technical Debt governance model where canonical branches are `main` and `develop`. Currently, there is a severe accumulation of stale and orphaned branches.

*   **Total Remote Branches:** 244
*   **Merged Branches (Safe to Delete):** 103 (These branches are fully merged into `develop` but were never deleted).
*   **Unmerged Branches (Require Audit):** 141 (These include stale feature branches, Copilot test branches, abandoned fixes, and incomplete phase operations).

**Action Required:**
1. Execute a bulk delete operation for the 103 merged branches using the `DELETE-CANDIDATE` criteria.
2. Review the 141 unmerged branches and either archive, merge, or delete them. `copilot/*` and `phase-*` branches make up a large portion of this bloat.

## 2. In-Code Debt (Markers)
*   **TODO markers:** 285 instances
*   **FIXME markers:** 3 instances

**Action Required:**
Convert critical `TODO`s into formal GitHub Issues and track them on the project board, or remove stale comments that are no longer relevant to the current architectural reality.

## 3. Pull Request Backlog
PRs that remain open indefinitely cause state drift between `develop` and integration paths.

**Action Required:**
Ensure PRs are squash-merged and the source branches are deleted immediately post-merge to prevent zombie branches.

## 4. Known Architectural Debt (From Debt Register)
*   **Multiple Service Worker Architecture:** Conflicting SW registrations (e.g., `sw.js`, `santis-sw.js`) that need consolidation.
*   **Tailwind Dependency Ownership:** Duplicate declarations in `package.json`.
*   **Design Token Fragmentation:** Hardcoded hex values (like `#d4af37`) instead of using centralized design tokens.

## Conclusion
The repository is suffering from significant "Git Entropy". The primary focus should be a **Branch Cleanup Phase** to enforce the "Zero Technical Debt" rule, deleting all merged branches and auditing the unmerged ones.
