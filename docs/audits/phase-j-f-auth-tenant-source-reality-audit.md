# SANTIS OS — PHASE J-F AUTH/TENANT SOURCE REALITY AUDIT

- **Date/Time:** 2026-05-23T08:43:00+02:00

## Files/Areas Inspected
- `apps/ingestion-api/package.json` and `src/server.ts`
- `pnpm-workspace.yaml`
- `packages/domain-schema/src/tenant.contract.ts`
- `packages/domain-schema/src/core-state.interface.ts`
- `packages/domain-schema/src/boardroom-state.contract.ts`

## Audit Questions & Findings

**1. Is there an existing trusted session manager?**
No. There is no `@santis/auth` or `@santis/session` package in the monorepo, nor is there any 3rd party identity provider configuration (like Clerk or Auth0) established at the workspace level.

**2. Is there an existing tenant context model?**
Yes. `packages/domain-schema/src/tenant.contract.ts` defines a strict `TenantContract` (with economics, guard policies, etc.), and `packages/domain-schema/src/core-state.interface.ts` defines a `SovereignContext` that includes this tenant. The data model is ready, but the mechanism to securely extract it from a request is missing.

**3. Is there an existing role/capability model for admin or boardroom?**
No. There are no Zod contracts defining `operatorId` roles, `admin` flags, or specific capability models for the Boardroom within the schema packages.

**4. Is there an existing middleware pattern in apps/ingestion-api?**
No. The `apps/ingestion-api` package only has `fastify` and `zod`. It lacks any `fastify-jwt`, `@fastify/auth`, or custom middleware to intercept, decode, and validate session tokens.

**5. Can /api/v1/boardroom/audit-log safely move beyond 501 now?**
No. Moving beyond 501 without these security boundaries would require implementing "fake security" (dummy tokens or hardcoded tenant IDs), which strictly violates the Zero Technical Debt and CoreState SSOT governance rules.

**6. If not, what minimum infrastructure must be created first?**
- An authoritative `@santis/session` (or similar) contract and provider.
- A defined `Role/Capability` schema in `@santis/domain-schema`.
- Fastify authentication middleware in `apps/ingestion-api` that securely maps an incoming token to a `SovereignContext`.

## Recommendation
- **KEEP_501_PLACEHOLDER**

## Recommended Phase J-G
**CREATE_AUTH_CONTEXT_CONTRACT_FIRST**: Before writing any functional middleware or connecting an identity provider, we must define the abstract Zod contract for a Session (e.g., `SessionContract` containing `operatorId`, `tenantId`, `roles`) within `@santis/domain-schema`. This locks the architecture boundary before choosing an implementation library.
