# SANTIS OS — PHASE J-M AUTH PREHANDLER INTEGRATION TEST PLAN

- **Date/Time:** 2026-05-23T09:08:00+02:00

## Current Route Behavior
- **Middleware:** None attached.
- **Route Response:** `GET /api/v1/boardroom/audit-log` currently returns a deterministic `501 Not Implemented` with a hardcoded fallback mock object.

## Required Environment Policy
Before attaching the middleware, the following environment variables must be securely governed:
- `SUPABASE_URL`: **Required**. Determines the issuer URL.
- `SUPABASE_JWKS_URL`: **Optional**. Overrides JWKS fetch URL if needed.
- `SUPABASE_JWT_AUDIENCE`: **Optional**. Enforces token audience if set.

## Integration Test Matrix (Pre-Live Data)
When the `boardroomAuthPreHandler` is attached to the route in the upcoming Phase J-N, the following strict HTTP status codes must be returned before the route handler is ever executed:

| Test Case | Expected HTTP Status | Expected Failure Point |
| :--- | :--- | :--- |
| **1.** No `Authorization` header | `401 Unauthorized` | PreHandler: Extract |
| **2.** Malformed `Authorization` header (`Bearer...`) | `401 Unauthorized` | PreHandler: Extract |
| **3.** Invalid/Expired JWT | `401 Unauthorized` | PreHandler: `jwtVerify` |
| **4.** Valid JWT missing `app_metadata.santis` | `401 Unauthorized` | PreHandler: `session-context` |
| **5.** Valid JWT missing `tenantId` scope | `403 Forbidden` (`ERR_TENANT_SCOPE_REQUIRED`) | PreHandler: `session-context` |
| **6.** Valid JWT lacking `admin`/`boardroom` / `audit-log:read` | `403 Forbidden` | PreHandler: `BoardroomReadableSessionSchema` |
| **7.** Valid Boardroom-Readable JWT | `501 Not Implemented` | Route Handler (Reaches route successfully, but 501 shield remains) |

## Security Confirmations
- **Fake Tokens Forbidden:** No dummy, mock, or fake security tokens are permitted outside of explicit unit test environments. The production pipeline relies solely on JWKS.
- **No Live Data in J-N:** In the upcoming Phase J-N, even if Test Case 7 passes, the endpoint must continue returning `501 Not Implemented` until real database/auth integration is fully cleared by the Boardroom.

## Recommended Phase J-N
**Phase J-N:** Execute the binding of `boardroomAuthPreHandler` to the `GET /api/v1/boardroom/audit-log` route in `apps/ingestion-api/src/routes/boardroom.routes.ts`. However, ensure the route's body continues to return `501 Not Implemented`.
