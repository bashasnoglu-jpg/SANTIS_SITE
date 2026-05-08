# SANTIS OS — Git Flow Governance

## 1. Branch Strategy

The Santis OS repository adheres to a strict, production-first branch strategy.

### Canonical Core Branches
- **`main`**: The Production-ready branch. Code here is actively serving traffic or ready to be deployed.
- **`develop`**: The Integration/Staging branch. All features must merge here before promotion to `main`.

### Canonical Branch Prefixes
All feature and maintenance work must branch off from `develop` using the following prefixes:
- `feature/*`: New application features or architectural components.
- `fix/*`: Bug fixes or defect resolutions.
- `chore/*`: Tooling, cleanup, dependencies, or governance metadata.
- `refactor/*`: Architectural cleanup without changing external behavior.
- `docs/*`: Documentation, rules, and audit reports.
- `hotfix/*`: Emergency production fixes branching directly from `main`.
- `archive/*`: Frozen, retired, or legacy branches preserved for historical context.

## 2. Push & Commit Policies

- **No Direct Commits to `main`:** All changes must originate from a PR.
- **No Force Push (`push -f`):** Force pushing to `main` or `develop` is strictly forbidden.
- **Code Reviews:** All PRs must pass CI checks and receive review before merging.

## 3. Hotfix Workflow

In the event of a production emergency:
1. Create a `hotfix/issue-name` branch directly from `main`.
2. Apply the fix and test strictly.
3. Merge the hotfix branch back into **both** `main` and `develop` to prevent regression.

## 4. Pull Request (PR) Flow

1. Create a designated branch (e.g., `chore/governance-cleanup`).
2. Keep the scope of the PR small and isolated ("Small Batch Delivery").
3. Ensure commit messages follow conventional formats (e.g., `feat: ...`, `chore: ...`).
4. Wait for CI checks (`lint`, `typecheck`, `audit:all`) to pass.
5. Merge via squash-and-merge or rebase to maintain a clean history.
