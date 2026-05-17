# SANTIS OS — Branch Policy

## 1. Allowed Branch Prefixes
All active development must fall into one of these categories:
- `feature/*`
- `fix/*`
- `chore/*`
- `refactor/*`
- `docs/*`
- `hotfix/*`
- `archive/*`

## 2. Forbidden Branch Names
Branches lacking descriptive context, prefixes, or tied to arbitrary states are prohibited:
- `test`
- `wip`
- `update`
- Names containing generic adjectives without a prefix (e.g., `new-navbar`).

## 3. Phase-* Branch Retirement Policy
The `phase-*` prefix (e.g., `phase-3-typography-canonicalization`, `phase-85`) is considered a temporary, isolated sprint marker. 
- **Policy:** Once a phase is successfully merged into `develop`/`main`, the corresponding `phase-*` branch MUST be deleted. Stale phase branches must be moved to `archive/phase-*`.

## 4. Legacy and Irregular Branch Management
- **`tech-debt/*` Rename Policy:** Branches labeled `tech-debt/*` must be renamed to `chore/*` or `refactor/*` depending on their impact. `tech-debt` is not a canonical prefix.
- **`vercel/*` Archive Policy:** Experimental deployment branches (e.g., `vercel/*`) must be archived (`archive/vercel/*`) or deleted once the pipeline is stable.

## 5. Environment Strategy Recommendation
- **`develop` Creation:** It is highly recommended to explicitly create and lock a `develop` branch to serve as the default target for all non-hotfix Pull Requests.

## 6. Deletion Approval
- **Branch Deletion Requires Human Approval:** Regardless of merge status, bulk cleanup or deletion of branches requires explicit approval from the Repository Governance Lead or Boardroom.
