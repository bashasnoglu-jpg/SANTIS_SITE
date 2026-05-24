# Phase K-4: Scheduling API Routes Architecture

This document describes the routing layout for the scheduling and availability engine, exposed securely via Fastify in the Ingestion API.

## Core Principles
1. **Tenant Isolation by Session:** The API never trusts a client-supplied `tenant_id` to determine data scope. The tenant boundary is derived securely from the authenticated JWT session (`request.santisContext.tenant.tenantId`).
2. **Strict Matching:** If a client explicitly passes a `tenant_id` in the query or body that differs from their session, the API immediately halts execution with a `403 TENANT_SCOPE_VIOLATION`.
3. **Zod Validation:** All endpoints run incoming queries and bodies through the `domain-schema` contracts.

## Implemented Routes (Phase K-4 Skeleton)

### `GET /api/v1/scheduling/resources`
- **Purpose:** Fetches static resource lists (Locations, Spa Areas, Rooms, Therapists, Services).
- **Current State:** Hydrated by static mocked fixtures.
- **Tenant Isolation:** Enforced.

### `GET /api/v1/scheduling/availability`
- **Purpose:** Exposes the K-3 Availability Engine mathematically calculating valid time slots.
- **Current State:** Calculates slots based on mocked DB state (fixtures).
- **Tenant Isolation:** Enforced.

### `GET /api/v1/scheduling/bookings`
- **Purpose:** Retrieves existing bookings.
- **Current State:** Returns static mocked fixtures.
- **Tenant Isolation:** Enforced.

### `POST /api/v1/scheduling/bookings`
- **Purpose:** Creates a new booking entry.
- **Current State:** ⚠️ **Returns 501 NOT_IMPLEMENTED_TRANSACTION_REQUIRED**
- **Architecture Note:** A standard SQL `INSERT` is insufficient for scheduling. Without pessimistic locking or serializable transactions, concurrent requests could book the same Therapist or Room. Phase K-5 will implement the DB layer with explicit transaction bounds before this route becomes operational.
