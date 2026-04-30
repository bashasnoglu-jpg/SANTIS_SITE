# Runtime Truth Lock Report

## Current Runtime Truth
- Branch: fix/runtime-truth-lock
- Base: main (identical at start)
- This PR intentionally avoids large runtime refactors.

## Commands Run
- pnpm install: NOT RUN (agent environment limitation)
- pnpm typecheck: NOT RUN
- pnpm test:quality:static: NOT RUN
- pnpm audit:runtime: NOT RUN
- git diff --check: PASS (GitHub-side file changes only)

## CoreState / SSE Status
CoreState is present in the repository.

Confirmed files:
- `apps/ingestion-api/src/routes/core-state.ts`
- `apps/ingestion-api/src/routes/core-state-stream.ts`
- `apps/ingestion-api/src/index.ts`
- `assets/js/api-client.js`
- `assets/js/modules/santis-corestate-stream-client.js`

Backend route truth:
- `registerCoreStateRoute(app)` exposes:
  - `GET /core-state`
  - `GET /api/v1/core-state`
- `createCoreStateStreamRouter()` exposes:
  - `GET /api/v1/core-state/stream`
- `apps/ingestion-api/src/index.ts` mounts the stream router with:
  - `app.use("/api/v1", createCoreStateStreamRouter())`

Important drift found:
- `assets/js/api-client.js` uses relative stream URL:
  - `/api/v1/core-state/stream`
- `assets/js/modules/santis-corestate-stream-client.js` uses hardcoded stream URL:
  - `http://localhost:3030/api/v1/core-state/stream`

Event name drift found:
- `assets/js/api-client.js` dispatches:
  - `SANTIS_CORE_STATE_PATCH`
- `assets/js/modules/santis-corestate-stream-client.js` dispatches:
  - `santis:corestate:patch`

Risk:
- Two frontend clients can represent the same stream differently.
- Runtime consumers may listen to different event names.
- Hardcoded localhost can break hosted or proxied environments.

Recommended next PR:
- `fix/corestate-stream-client-unification`

## Boardroom Health Overlay Status
- File exists: `assets/js/modules/santis-boardroom-dev-health-overlay.js`
- Runtime binding status: UNKNOWN (not verified in browser runtime)
- Should verify whether Boardroom loads the overlay and listens to the same CoreState event name.

## Oracle v2 Governance Status
Recent PR history confirms existence of:
- statistical forecast
- execution outcomes
- execution guard

Runtime linkage: UNKNOWN
Governance assumption: human-gated based on PR descriptions.

Required local verification:
- `GET /api/v1/oracle/statistical-forecast`
- `GET /api/v1/oracle/execution-outcomes`
- `GET /api/v1/oracle/execution-guard`

## TypeScript Contract Drift
Known risk areas from PR history:
- `tenantId` contract
- `resolve-experience` imports
- realtime Drizzle typing

Actual status: NOT VERIFIED because `pnpm typecheck` was not executable in the agent environment.

## Repo Size / Asset Hygiene
- Repo size: ~187MB
- Risk: potential large assets or historical build artifacts
- Action taken:
  - Added `.next/`, `coverage/`, `_deploy_stage/` to `.gitignore`

## Changes Made
- Updated `.gitignore` to include missing build/cache paths.
- Added this runtime truth report.
- Updated CoreState status from UNKNOWN to PRESENT WITH DRIFT.

## Remaining Risks
- TypeScript contract drift not validated locally.
- Oracle runtime endpoints not verified locally.
- Boardroom overlay binding not confirmed in browser runtime.
- Repo size not fully audited with local filesystem commands.
- CoreState frontend event contract is split across at least two clients.

## Next Recommended PRs
1. `fix/corestate-stream-client-unification`
2. `fix/typescript-contract-drift`
3. `audit/repo-size-and-assets`

## Notes
This PR establishes a verifiable baseline before deeper intervention.
The highest-priority finding is CoreState stream client drift, not CoreState absence.
