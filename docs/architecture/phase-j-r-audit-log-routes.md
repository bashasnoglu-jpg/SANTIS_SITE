# Phase J-R: Audit Log Route Implementation

## 1. Route Contract

The Audit Log read API follows the standard Santis OS REST conventions, exposing tenant-scoped audit logs for Boardroom administrators.

### `GET /api/v1/boardroom/audit-log`

Retrieves a paginated list of audit logs for the authenticated tenant.

**Response Structure (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "actorType": "user",
      "actorOperatorId": "uuid",
      "action": "auth.login",
      "payload": {},
      "payloadSchemaVersion": 1,
      "source": "api",
      "createdAt": "2026-05-24T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

## 2. Authentication & Pre-Handler Model

The route utilizes the canonical `boardroomAuthPreHandler` from `packages/domain-contracts/session.contract.ts`.

- **Authentication:** Requires a valid Supabase JWT or a valid `santis_session` HttpOnly cookie.
- **Authorization:** Requires the session to contain a valid `app_metadata.santis` object indicating minimum Boardroom read capabilities (`boardroom:read` or `audit-log:read`).
- **Tenant Isolation:** The `tenantId` is strictly derived from the validated `request.santisContext.tenant.tenantId`. Client-provided tenant IDs are strictly ignored during reads to prevent cross-tenant enumeration.

## 3. Query Parameters & Filtering Strategy

The route supports robust query parameters validated via Zod (`AuditLogQuerySchema`).

| Parameter   | Type     | Default | Description                                                                 |
|-------------|----------|---------|-----------------------------------------------------------------------------|
| `limit`     | number   | 50      | Number of records to return (1-100).                                        |
| `offset`    | number   | 0       | Number of records to skip for pagination.                                   |
| `action`    | enum     | null    | Filter by specific audit action (e.g., `auth.login`, `booking.created`).    |
| `actorType` | enum     | null    | Filter by actor type (`user`, `system`, `service`, `ai`, `webhook`).        |
| `source`    | enum     | null    | Filter by source (`api`, `admin`, `system`, `worker`, `webhook`).           |
| `startDate` | ISO Date | null    | Filter records created on or after this timestamp.                          |
| `endDate`   | ISO Date | null    | Filter records created on or before this timestamp.                         |

### Validation Failures

If invalid parameters are provided (e.g., `startDate` is after `endDate`, or an unknown `action` is provided), the route immediately short-circuits and returns a `400 Bad Request` containing the specific Zod validation details.

## 4. Pagination Strategy

Pagination is offset-based, leveraging Drizzle ORM's `.limit()` and `.offset()` capabilities. The repository layer returns a tuple of `{ data, total }` where `total` is computed via a parallel `count(*)` query utilizing the exact same filtering conditions as the data retrieval query.

## 5. Mock DB Testing Boundary

To enforce the "Zero Live-DB-Impact" rule during the application phases prior to the DB APPLY gate, all testing for this route uses an injected Mock DB interface that replicates Drizzle's `.where()`, `.limit()`, and `.offset()` chained methods.

- Real SQL generation is bypassed.
- The `AuditLogService` and `GET` route are fully tested under integration conditions simulating database interactions.
- Live Supabase verification remains entirely deferred until the Boardroom explicitly approves and executes the DB APPLY migration phase.
