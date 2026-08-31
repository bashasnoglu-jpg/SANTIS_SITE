# Phase J-Q1: Audit Log Contract Architecture Hardening

**Status:** J-Q1 CONTRACT HARDENED / PERSISTENCE DECOUPLED

## Goal
Refactor the Phase J-Q audit log contract to ensure that `@santis-core/domain-contracts` remains a pure Zod schema contract, while moving Drizzle ORM persistence definitions to `@santis/database`. This architecture strictly isolates the domain schema from persistence mechanics.

## DB-Level Immutability Plan
The Audit Log is an append-only repository. Updates and deletions of audit events are explicitly forbidden by design.

To enforce this at the database level:
1. **No UPDATE/DELETE Grants:** The application role used to connect to the database must not be granted `UPDATE` or `DELETE` permissions on the `audit_logs` table.
2. **Database Trigger (Future Check):** An optional future trigger will be implemented to automatically reject any `UPDATE` or `DELETE` commands attempted on `audit_logs`, regardless of the user role.
3. **DB-Generated Timestamps:** The `createdAt` field is generated exclusively by the database (`defaultNow()`), preventing application-level timestamp spoofing.
4. **Append-Only Operations:** The application layer repository for audit logs will not expose any `update` or `delete` methods.

## Data Structure Hardening
1. **Raw IP and User Agent Removed:** Raw `ipAddress` and `userAgent` are no longer persisted for data privacy reasons. We now store `ipHash` and `userAgentHash` using a 64-character SHA-256 string.
2. **Unified actorOperatorId:** `actorId` and `operatorId` have been unified into a single `actorOperatorId` which persists as a canonical UUID (matching Supabase `sub` claims).
3. **Action:** The event string is now correctly represented as `action` to match database schema conventions.
4. **Resources:** `resourceId` and `resourceType` are optional strings (max 255 chars) because some system events do not map to a specific resource.
5. **Payload Safety:** Payloads are stored as `JSONB` and verified via Zod to reject any forbidden security keys.

## Indexing Strategy
The Drizzle schema in `@santis/database` explicitly defines the following indexes for high-performance querying:
- `tenant_id + created_at DESC`
- `tenant_id + action + created_at DESC`
- `tenant_id + resource_type + resource_id`
- `actor_operator_id + created_at DESC`
