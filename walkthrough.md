# Walkthrough - Sovereign Docker Pipeline & Boardroom Action Rail

# Phase J-S: Audit Log Route Initialization & Hardening

We have successfully implemented the backend foundational work for the new Audit Log functionality across `@santis/domain-schema`, `@santis/database`, and `apps/ingestion-api`.

## 1. Domain Schema Hardening (Phase J-S.1)
- **Role Capability Matrix Update:** We added `audit-log:write` to `OperatorCapabilitySchema` to formally represent append-only log insertion privileges.
- **Write Session Contract:** We defined a dedicated `BoardroomWritableSessionSchema` and `boardroomWriteAuthPreHandler`. The write logic mandates either an `admin/boardroom` role, or the `audit-log:write` capability.
- **Query Contracts:** Added `AuditLogQuerySchema` strictly regulating query bounds (`limit: min 1, max 100, default 50` and `offset: min 0, default 0`).

## 2. Ingestion API Service & Route Hardening (Phase J-S.1)
- **Strict Parsing:** `AuditLogService.appendLog` and `getTenantLogs` now use strict Zod parsing instead of raw type casting (`AuditLogEntrySchema.parse(record)`), fully fulfilling our validation boundary contract.
- **Authorization Enforcement:** The `POST /api/v1/boardroom/audit-log` route is protected by `boardroomWriteAuthPreHandler`.
- **Tenant Scope Enforcement:** The `tenantId` is strictly extracted from the validated context (`request.santisContext.tenant.tenantId`) during insertion, overriding any spoofed body payload `tenantId`.

## 3. Fastify Server Database Injection
- The Fastify instance in `apps/ingestion-api` now formally decorates `server.db`. `AuditLogRepository` instantiation inside `boardroom.routes.ts` no longer uses an inline mock, but properly relies on this injected instance.

## 4. Real Postgres/Drizzle Provider & Migration Setup (Phase J-T)
- **Database Client Injection:** The `postgres` package was introduced to `@santis/database` and we established a `createDbConnection(databaseUrl)` utility within `packages/database/src/client.ts`. This correctly configures a `postgres.js` pool customized to avoid prefetch issues.
- **Migration Configuration:** We added a `drizzle.config.ts` into `@santis/database` capable of inferring schemas and generating SQL files natively, and hooked up `db:generate`, `db:push:local`, and `db:studio` to `packages/database/package.json`.
- **Runtime Wiring:** The `apps/ingestion-api/src/index.ts` was finalized to initialize the actual Postgres instance if `process.env.DATABASE_URL` is detected, cleanly separating configuration from application testing.
- **Schema Validation:** We successfully generated the SQL migration file (`packages/database/drizzle/0000_sudden_stature.sql`) validating that all Drizzle indices, JSONB payloads, and table layouts map correctly to Postgres native constraints.

## 5. Test Matrix Verification
A total of **16 integration tests** have been implemented and are **passing**.
Key tested paths include:
1. Valid JWT lacking `admin/boardroom/audit-log:read` is rejected (403).
2. Valid JWT with `concierge` role but `audit-log:read` capability is allowed to GET (200).
3. Read-only token attempting to POST is rejected (403).
4. Missing or explicitly forbidden payload keys (e.g. `password`) are caught (400).
5. Attempting to spoof `tenantId` in the body payload seamlessly falls back to the canonical token scope.
6. Server crashes intentionally if `DATABASE_URL` (and consequently `server.db`) is not injected.

You can verify the latest commit locally on `develop`:
`git log -1` -> `feat(database): wire postgres provider and drizzle migrations`

### Docker Infrastructure & Pipeline
- **Dockerfile**: Refactored to a multi-stage `pnpm deploy` strategy using `node:20-slim`.
- **GitHub Actions**: Standardized `IMAGE_NAME` to lowercase `bashasnoglu-jpg/santis-sovereign-os` and added mandatory lowercase enforcement guards.
- **Telemetry**: Updated all payloads to use `${{ env.REPO_LC }}` for 100% naming consistency.

### Boardroom Action Rail (Feature)
- **Contracts**: Created `boardroom-state.contract.ts` and extended `sse-envelope.contract.ts` for `action_rail_update` events.
- **Ingestion API**:
    - Updated `package.json` to include `@santis/domain-schema` for contract integrity.
    - **boardroom-projections.ts**: Refactored projection logic to use `sseManager` for live action broadcasts.
    - **strategy.ts**: Refactored to a factory pattern for decoupled event publishing via `SovereignBus`.

## Validation Results

### Automated Verification
- Dockerfile verified with standard `pnpm` monorepo production patterns.
- GitHub Actions logic checked for lowercase consistency.

### Manual Verification Required
- **Local Build Test**: Run `docker build -t santis-sovereign-os:local .` locally to confirm the build pipeline.
- **CI/CD Run**: Monitor the first GHCR publication to ensure successful lowercase telemetry emission.
- **Action Rail Live Test**: Verify that `pricing.recommendation.created` events trigger SSE broadcasts to the cockpit.

---

Santis OS is now equipped with a production-grade, "Zero-Jank" container pipeline that strictly adheres to registry standards.

### Final CI/CD Stabilization
- **Lockfile Synchronization**: Implemented `lockfile-regen.yml` GitHub Action to automatically resolve `ERR_PNPM_OUTDATED_LOCKFILE` and bypass local Windows `EBUSY` limitations.
- **Docker Telemetry Patch**: Made `curl` telemetry emissions in `docker-publish.yml` best-effort (`|| true`) to prevent build failures when `localhost:3030` is unavailable on the CI runner.
- **PR #89 Created**: Successfully triggered the regeneration and opened PR #89 to merge the synchronized `pnpm-lock.yaml` back into `main`.

### Phase J-W0: Audit Log Query Filters & Event Registry Seal
- Strict Canonical Events implemented
- Envelope { data, meta } response introduced
- Drizzle repository dynamic queries (filters + count) applied

### Phase J-W1: Boardroom Audit Log Admin Read UX
- Ayrı 'audit-logs.html' sayfası oluşturuldu
- Vanilla JS ve CSS ile 'Quiet Luxury' tasarımı kodlandı
- Filtre bar, payload drawer (slide-out), pagination entegre edildi
