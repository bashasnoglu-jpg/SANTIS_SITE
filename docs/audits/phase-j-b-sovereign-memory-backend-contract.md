# SANTIS OS — PHASE J-B: SOVEREIGN MEMORY BACKEND CONTRACT AUDIT

- **Date/Time:** 2026-05-23T08:08:00+02:00

## 1. Existing Frontend Contract
Phase J-A successfully implemented a secure frontend fallback in `admin-panel/src/components/dashboard/SovereignMemoryPanel.jsx`. 
The frontend currently expects the following:
- Service layer (`boardroomAuditLog.js`) attempts to `fetch('/api/v1/boardroom/audit-log')`.
- Fallbacks to a protected, immutable mock object (`MOCK_AUDIT_LOG`) if the endpoint returns HTTP 404 or a network error.
- The UI handles the `source` identifier (`mock` vs `live`) to display a "Demo kayıtları" info tag when running locally without a backend.

## 2. Proposed Endpoint
**Endpoint:** `GET /api/v1/boardroom/audit-log`
**Method:** `GET`
**Content-Type:** `application/json`

## 3. Proposed Response Shape
The official Santis Runtime Contract requires exactly this schema for maximum predictability:
```json
{
  "data": [
    {
      "id": "string (UUID or ULID)",
      "type": "string (enum)",
      "actionId": "string",
      "operatorId": "string",
      "reason": "string",
      "occurredAt": "string (ISO 8601 Date)"
    }
  ]
}
```

## 4. Allowed Event Types
Only the following exact strings are allowed for the `type` field to maintain "Quiet Luxury" aesthetic determinism in the UI:
- `action.approved`
- `action.rejected`

## 5. Tenant & Admin Boundary Requirements
- **Tenant Isolation:** The audit log must be strictly scoped to the tenant requesting the data. Cross-tenant leakage is a critical failure.
- **Admin Boundary:** Only authenticated identities holding `admin` or `boardroom` privileges are authorized to read this endpoint.

## 6. Authorization Requirement
- **Token:** Requests must include a valid session token (e.g., Bearer Token or Secure HttpOnly Cookie).
- **Validation:** The endpoint MUST use Zod (or equivalent runtime schema validation) to assert the identity context before returning any historical data.

## 7. Pagination or Limit Recommendation
- To prevent heavy payload rendering on the UI, the endpoint should enforce a strict default limit (e.g., `?limit=50`).
- Future iterations can introduce cursor-based pagination if deep historical scanning is required.

## 8. Error Response Recommendation
Error formats must follow a deterministic JSON structure. E.g.:
```json
{
  "error": "Unauthorized",
  "code": "ERR_UNAUTHORIZED",
  "message": "Valid Boardroom session required."
}
```
HTTP 401 for invalid tokens, HTTP 403 for insufficient privileges.

## 9. Transition from Mock to Live
When the backend endpoint is eventually deployed, the UI requires **zero code changes**. The `fetchBoardroomAuditLog` service will naturally intercept the HTTP 200 JSON payload, return `source: 'live'`, and the SovereignMemoryPanel will silently remove the "Demo kayıtları / Backend bekleniyor" label and populate real data.

## 10. What Must NOT Be Implemented Yet
- DO NOT create any backend routing logic (`apps/ingestion-api` or Next.js `api/` folders) in this phase.
- DO NOT implement any database schemas (Prisma/Drizzle) for Audit Logs yet.
- DO NOT modify the existing admin-panel UI.

## 11. Final Recommendation for Phase J-C
This Backend Contract is sealed. Phase J-C should solely focus on initializing the backend workspace infrastructure (`apps/ingestion-api` or equivalent API package) with proper TypeScript and Zod integrations, ensuring that when the endpoint is wired up, it strictly conforms to this audited document.
