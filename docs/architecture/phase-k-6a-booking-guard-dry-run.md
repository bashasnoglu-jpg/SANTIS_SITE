# Phase K-6A: Booking Guard Dry-Run Validation

## Objective
To implement a dry-run validation endpoint for the Santis OS Boardroom scheduling module without introducing any destructive database writes. This serves as a safety gate to test the `scheduling.booking-guard.ts` logic in a mock integration environment.

## Components

1. **Domain Contract (scheduling.api.ts)**
   - `ValidateBookingRequestSchema`: Mirrors the booking creation request.
   - `ValidateBookingResponseSchema`: Extends `BookingGuardResult` to return `allowed: boolean`, `conflict_code`, and `conflict_reason`.

2. **Endpoint (scheduling.routes.ts)**
   - `POST /v1/scheduling/booking/validate`
   - **PreHandler**: Requires `boardroomWriteAuthPreHandler` authorization and valid tenant context.
   - **Operation**:
     - Extracts requested booking parameters.
     - Constructs a mock `BookingGuardContext` populated by `MOCK_SERVICES`, `MOCK_ROOMS`, `MOCK_THERAPISTS`, etc.
     - Calls `evaluateBooking(proposed, ctx)`.
     - Returns the exact result to the client (200 OK).
   - **Safety Guarantee**: Does not inject or call any `db.insert`, `db.update`, or `db.delete` methods.

3. **Validation Logic (scheduling.booking-guard.ts)**
   Evaluates 7 sequential constraints:
   1. Time range validity.
   2. Tenant scope and active resource verification.
   3. Service-Room and Service-Therapist compatibilities.
   4. Operating hours alignment.
   5. Therapist shift coverage.
   6. Hard blocker collision (maintenance, out of office).
   7. Existing active bookings overlap.

## Test Strategy (scheduling.routes.test.ts)
7 explicit unit tests confirm behavior:
1. `allowed=true` for valid, non-overlapping requests.
2. `ROOM_BOOKING_CONFLICT` for existing room reservations.
3. `THERAPIST_OUTSIDE_SHIFT` for outside hours.
4. `ROOM_BLOCKED` for maintenance periods.
5. `ROOM_NOT_COMPATIBLE` / `THERAPIST_NOT_COMPATIBLE` for mismatch.
6. `400 Bad Request` for invalid schemas.
7. Explicit test verifying no DB writes occur during execution.

## Future Phases
- **Phase K-6B**: Replace the mock context in the POST route with live context hydration from the database (still read-only validation).
- **Phase K-7**: Implement the actual transactional INSERT with Row Level Locking based on the dry-run guard's clearance.
