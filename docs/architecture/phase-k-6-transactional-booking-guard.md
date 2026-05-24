# Phase K-6: Transactional Booking Guard

**Status:** PHASE K-6 TRANSACTIONAL GUARD READY / DB WRITE STILL DISABLED

## Goal
Design and implement a pure-function booking guard layer that acts as the final gatekeeper before a transactional write to the database occurs. This layer ensures that any proposed booking complies with all business rules and does not introduce race condition conflicts with existing database state.

## Architecture & Responsibilities

The `evaluateBooking` guard function validates a `ProposedBooking` against a `BookingGuardContext`. It returns a standardized `BookingGuardResult` indicating whether the booking is allowed, and if not, provides explicit failure codes and conflict details.

### 1. Data Validation
- **Time Range Integrity:** Validates that `service_start_time` < `service_end_time` <= `cleanup_end_time`. (Returns `INVALID_TIME_RANGE`).

### 2. Tenant Isolation & Scope
- Enforces multi-tenant isolation by explicitly verifying that the proposed `service`, `room`, and `therapist` belong to the provided `tenant_id`. (Returns `SERVICE_NOT_FOUND` or `TENANT_SCOPE_VIOLATION`).

### 3. Capability Enforcement
- **Room Compatibility:** Checks if the target room supports the targeted service. (Returns `ROOM_NOT_COMPATIBLE`).
- **Therapist Compatibility:** Checks if the assigned therapist is certified for the service. (Returns `THERAPIST_NOT_COMPATIBLE`).

### 4. Scheduling Rules
- **Operating Hours:** Ensures the entire booking (including cleanup) falls within the spa area's location operating hours for the given day. (Returns `OUTSIDE_OPERATING_HOURS`).
- **Therapist Shifts:** Ensures the therapist is officially on shift during the core service time (does not require therapist for room cleanup). (Returns `THERAPIST_OUTSIDE_SHIFT`).

### 5. Conflict Avoidance (Half-Open Intervals)
Conflict detection rigorously follows the half-open interval model `[start, end)`.
- **Blockers:** Ensures neither the room nor the therapist is blocked during the necessary timeframes. (Returns `ROOM_BLOCKED` or `THERAPIST_BLOCKED`).
- **Active Bookings:** Checks against existing bookings with active statuses (`confirmed`, `in_progress`, `checked_in`). Overlaps evaluate cleanup time for rooms but only service time for therapists. (Returns `ROOM_BOOKING_CONFLICT` or `THERAPIST_BOOKING_CONFLICT`).
- **Ignored States:** Bookings that are `cancelled`, `completed`, or `no_show` are safely ignored by the guard.

## Future Integration (Phase K-7)
This pure function acts as the core of our transaction safety net. In Phase K-7, the `POST /api/v1/scheduling/bookings` route will:
1. Open a database transaction.
2. Query all relevant context for the target time window (lock reads if necessary).
3. Pass the context and proposed booking to this `evaluateBooking` guard.
4. If `allowed: true`, proceed with `INSERT`.
5. If `allowed: false`, roll back the transaction and return the guard's explicit `conflict_code` to the client.
