# Phase K-5: Scheduling DB Migration Hardening

**Status:** PHASE K-5 MIGRATION DRAFT HARDENED / DB APPLY PENDING

## Goal
Harden the initial Phase K-1 scheduling SQL draft into a production-ready PostgreSQL schema without executing it on the live Supabase environment. This ensures all production constraints are accounted for before finalizing the transactional layer (Phase K-6).

## Changes Made

### 0. Schema Promotion
- **File Renaming**: The `Phase K-1 SQL draft` was promoted and renamed to `Phase K-5 hardened schema proposal` (`docs/db/phase-k-5-scheduling-schema.sql`) to reflect its production-ready state while adhering to Zero Technical Debt.

### 1. Tenant Isolation
- **Foreign Key Limitation**: Explicitly documented that `tenant_id` does not have a foreign key in this script because the `tenants` table is managed under Core Auth (Phase J-X) and lies outside this bounded context.
- **Row Level Security (RLS)**: Drafted comprehensive RLS policies for all 11 scheduling tables to strictly isolate rows based on the `tenantId` claim stored within `request.jwt.claims`.

### 2. Constraints Added
- Added `UNIQUE` constraints to enforce entity uniqueness within a tenant scope (e.g., `locations (tenant_id, name)`).
- Added `CHECK (default_slot_interval_minutes > 0)` to `spa_areas`.
- Added `CHECK (close_time > open_time)` to `operating_hours`.
- Verified existing time constraints on `bookings` (`service_end_time > service_start_time` and `cleanup_end_time >= service_end_time`).

### 3. Exclusion Constraints (Overlap Prevention)
- Proposed `btree_gist` based exclusion constraints to physically prevent overlapping active bookings at the database level.
- Covered both `room_id` (accounting for service + cleanup time) and `therapist_id` (accounting for service time only).
- **Fallback Note:** If the Supabase environment restricts the `btree_gist` extension, this responsibility will definitively fall to the transactional logic implemented in Phase K-6.

### 4. Indexing Strategy
- Introduced covering indexes for critical scheduling lookups:
  - `idx_bookings_tenant_room_time`
  - `idx_bookings_tenant_therapist_time`
  - `idx_blockers_tenant_room_time`
  - `idx_blockers_tenant_therapist_time`
- These indexes significantly optimize time-range queries essential for the availability engine calculation.

### 5. Rollback Notes
- Documented explicit `DROP TABLE ... CASCADE` and `DROP TYPE ...` commands to ensure a clean slate removal path if migration rollback is ever required.

## Next Steps
- Implement transactional guarantees for `POST /bookings` (Phase K-6) ensuring absolute protection even in high-concurrency environments, compensating for any missing database-level exclusion constraints.
- Only apply the SQL migrations to Supabase after the transactional route architecture is fully sealed.
