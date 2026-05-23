# SANTIS OS — PHASE J-Q BOARDROOM AUDIT LOG PERSISTENCE CONTRACT

**Date:** 2026-05-23
**Mode:** ARCHITECTURE & BACKEND CONTRACT

## Context
Phase J-N and J-P implemented the `boardroomAuthPreHandler` and successfully tested the capability extraction and tenant isolation layer using JWKS verification. The next phase, J-Q, prepares the application for storing audit events.
Before any UI is written, the exact structure of the audit log must be formalized as a CoreState SSOT to enforce strict typings and security guarantees.

## Goal
Implement the backend persistence contract for the audit log, defining the Zod schemas and Drizzle ORM table definitions based on the approved schema.

## Approved Schema
Table: `audit_log_events`
Fields:
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Mandatory - Tenant Isolation)
- `actor_operator_id`: UUID (Who performed the action)
- `action`: String (e.g., `LOGIN`, `UPDATE_SETTINGS`)
- `resource_type`: String (e.g., `USER`, `TENANT`)
- `resource_id`: String (Target resource)
- `payload_json`: JSONB (Flexible context data)
- `ip_hash`: String (Hashed IP address for compliance)
- `user_agent_hash`: String (Hashed User Agent)
- `created_at`: Timestamp (Immutable, auto-generated)

## Zero Technical Debt Guarantees
- The `audit-log.contract.ts` is explicitly exported from `@santis/domain-schema`.
- Drizzle table uses `uuid` and `jsonb` mapping natively to PostgreSQL.
- Zod schema ensures inputs matching this shape are validated before DB insertion.

## Next Actions
This contract will be used by the `ingestion-api` in Phase J-R to begin logging actual middleware events into the database once live traffic is approved.
