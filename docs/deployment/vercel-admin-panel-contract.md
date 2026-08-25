# Admin-Panel Deployment Contract

## 1. Purpose

This document establishes the constitutional deployment topology for the Santis OS `admin-panel`.

The `admin-panel` must be built from the **pnpm workspace root**. This ensures deterministic resolution of workspace dependencies, including:

- `@santis/ui`
- `@santis-core/event-contracts`

Building directly inside the child directory can isolate the package from the repository single source of truth. That creates silent failures, missing workspace packages, and deployment topology drift.

## 2. Constitutional Formula

In the Santis OS architecture, deployment is not an external operational concern. It is a verifiable contract.

```txt
Repo = Truth
CI = Validator
Dashboard = Projection Surface
```

The Vercel dashboard must project the repository contract. It must not become the source of truth.

## 3. Required Topology — Vercel Projection

The `santis-site-admin-panel` Vercel project must mirror the repository contract exactly.

| Setting | Required Value |
| --- | --- |
| Root Directory | repo root / empty default, not `admin-panel` |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter admin-panel build` |
| Output Directory | `admin-panel/dist` |

## 4. Failure Signatures

If the projection surface drifts from the topology, these signatures may appear in the logs:

```txt
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND
Cannot find module '@santis/ui'
Cannot find module '@santis-core/event-contracts'
cp: cannot stat 'admin-panel/dist/*'
No Output Directory named "dist" found
Command "pnpm build" exited with 1
```

These are not random deployment errors. They indicate workspace topology drift.

## 5. Validation Ritual

Before projecting to Vercel, verify the topology from the repository root:

```bash
pnpm run build:vercel-admin-sim
```

Expected result:

```txt
RESULT: SOVEREIGN TOPOLOGY CONFIRMED
```

## 6. Governance Boundary

This contract is separate from Sovereign Guard dependency detox work.

- PR #176 governs active workspace lockfile policy and strict contract scanning.
- This deployment contract governs admin-panel Vercel topology.

Do not mix deployment topology fixes into dependency detox PRs.
