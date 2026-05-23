# SANTIS OS — PHASE J-O AUTH RUNTIME SMOKE TEST CONTRACT

- **Date/Time:** 2026-05-23T09:16:00+02:00

## Current Route Behavior (Post Phase J-N)
The `boardroomAuthPreHandler` has been attached to the `GET /api/v1/boardroom/audit-log` route. The route is now fully protected by asymmetric JWKS verification. However, the route's body still intentionally returns a deterministic `501 Not Implemented` response.

## Runtime Smoke Test Contract
Any automated or manual testing against this route MUST yield the exact responses listed below, determined by the HTTP status and code.

| Scenario | Expected Status | Expected Auth Error Code / Behavior |
| :--- | :--- | :--- |
| **1. Missing `Authorization` header** | `401 Unauthorized` | `ERR_UNAUTHORIZED` |
| **2. Malformed `Authorization` header** | `401 Unauthorized` | `ERR_UNAUTHORIZED` |
| **3. Invalid/Expired JWT** | `401 Unauthorized` | `ERR_UNAUTHORIZED` |
| **4. Valid JWT, missing `app_metadata.santis`** | `401 Unauthorized` | `ERR_UNAUTHORIZED` |
| **5. Valid JWT, missing `tenantId`** | `403 Forbidden` | `ERR_TENANT_SCOPE_REQUIRED` |
| **6. Valid JWT, lacking capabilities** | `403 Forbidden` | `ERR_FORBIDDEN` |
| **7. Valid Boardroom-Readable JWT** | `501 Not Implemented` | `ERR_BOARDROOM_AUDIT_LOG_NOT_IMPLEMENTED` (Route reached successfully) |

## Required Environment for Real Token Tests
If executing against a live identity provider (Supabase), the host environment must inject:
- `SUPABASE_URL` (Required, dictates `issuer`)
- `SUPABASE_JWKS_URL` (Optional)
- `SUPABASE_JWT_AUDIENCE` (Optional)

## Security Confirmations
- **No Fake Tokens:** It is strictly forbidden to commit or use dummy production tokens to bypass this route logic.
- **Live Data Disabled:** The 501 response on successful authorization confirms that live database queries and audit-log generation are not implemented.

## Recommended Phase J-P
**Phase J-P:** Add isolated integration tests using a mocked JWKS interceptor only in the test environment (e.g. using Vitest / Nock), or execute the real Supabase environment smoke test if formally approved by the Boardroom.
