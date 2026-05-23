# SANTIS OS — PHASE J-E SOVEREIGN MEMORY AUTH/TENANT BOUNDARY DESIGN

- **Date/Time:** 2026-05-23T08:29:00+02:00

## Current Route Behavior
The backend endpoint `GET /api/v1/boardroom/audit-log` is currently configured to deterministically return a **501 Not Implemented** status. The error payload explicitly states:
> "Sovereign Memory backend requires auth and tenant boundary implementation before live data can be served."
This guarantees no insecure data leaks and forces the frontend to remain safely in its mock fallback state.

## Required Authorization and Tenant Boundary

Before this route can serve live data, the following boundaries **must** be implemented at the framework level (Fastify hooks/middleware), not within the route handler itself.

### 1. Required Auth Model
- Requests must contain a verified session token or signed JWT that proves the identity of the operator.
- The authentication source of truth must be the centralized Boardroom session manager (or an equivalent zero-trust issuer).
- **Why fake Bearer mock tokens are forbidden:** Mocking security creates a false sense of compliance (Technical Debt) that might accidentally be merged to `main`, bypassing the Boardroom governance.

### 2. Required Tenant Context Shape
- The system must determine the tenant ID (e.g., `tenantId` or `propertyId`) directly from the trusted session context.
- **Critical rule:** The tenant scope must **never** be derived from the request body, query parameters, or arbitrary HTTP headers (unless cryptographically signed and verified). Deriving tenant boundaries from client input introduces Cross-Tenant Data Leak vulnerabilities (IDOR).

### 3. Required Role Checks
- The authenticated identity must possess the explicit role of `admin` or a specific `boardroom` capability tag.
- Access without these roles must be immediately rejected before the route handler is invoked.

## Required Error Codes
The API contract must explicitly map boundary violations to the following Zod-validated error codes:
- `ERR_UNAUTHORIZED`: Valid session token is missing or expired. (HTTP 401)
- `ERR_FORBIDDEN`: Session is valid, but the user lacks `admin` or `boardroom` roles. (HTTP 403)
- `ERR_TENANT_SCOPE_REQUIRED`: The session is valid, but it is not bound to a specific tenant context required for auditing. (HTTP 400/403)
- `ERR_BOARDROOM_AUDIT_LOG_NOT_IMPLEMENTED`: Reserved for the current placeholder state until the live data layer is attached. (HTTP 501)

## Validation Requirements (Zod)
- The expected request shape (e.g., pagination query parameters) must be validated with Zod.
- The `ErrorResponseSchema` and `BoardroomAuditLogResponseSchema` already defined in `boardroom-audit-log.contract.ts` must be strictly applied to outgoing payloads to ensure the shape of the data never diverges from the contract.

## Why Fake Data is Forbidden
- **Why dummy successful audit data is forbidden:** Serving hardcoded `200 OK` responses from the backend creates "Zombie Code". It tricks the frontend into thinking the integration is complete, hiding the absence of a real database. It violates the single source of truth (CoreState). The frontend already has a dedicated `mock` fallback layer (`admin-panel/src/mocks/sovereignMemoryAuditLog.js`); the backend must only return real data or an explicit error.

## Recommended Phase J-F
**Phase J-F:** Implement the real auth boundary only if the centralized session/tenant source exists and is approved by the Boardroom. Otherwise, **keep the deterministic 501 response** to protect the architecture from technical debt and insecure access.
