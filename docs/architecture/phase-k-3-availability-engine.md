# Phase K-3: Availability Engine Architecture

This document describes the pure deterministic function designed in Phase K-3 to calculate spa availability across `Rooms`, `Therapists`, `Services`, `Blockers`, and `Bookings`.

## Core Philosophy: The Pure Function
The engine (`calculateAvailability`) does not access the database directly. Instead, it takes a fully hydrated `AvailabilityEngineContext` (representing all relevant data for a specific Tenant, Location, SpaArea, and Target Date) and returns an array of `AvailabilitySlot` objects. This separation ensures:
1. **Determinism:** The same context yields the identical slots.
2. **Testability:** Complete unit coverage without database mock complexity.
3. **Execution Safety:** The engine calculates availability mathematically and safely.

## Half-Open Interval Mathematics
To determine if two time spans overlap, the engine employs strict half-open interval `[start, end)` arithmetic, converted uniformly to Epoch milliseconds:
```typescript
aStartMs < bEndMs && aEndMs > bStartMs
```
This ensures that back-to-back bookings (e.g. Booking A ends exactly at `11:00`, Booking B starts exactly at `11:00`) do not register as a collision.

## The Quantization Algorithm
1. Retrieve `open_time` and `close_time` for the target date from `OperatingHours`.
2. Generate slots at increments of `SpaArea.default_slot_interval_minutes` (e.g. 15 mins).
3. For each slot, calculate:
   - `slot_start`
   - `service_end_time` = `slot_start + duration_minutes`
   - `cleanup_end_time` = `service_end_time + cleanup_minutes`
4. The entire span `[slot_start, cleanup_end_time)` must fit within operating hours.

## Compatibility and Collisions
For each generated slot, the algorithm attempts to form a valid (Room + Therapist) pair.
- **Rooms:** Must be explicitly compatible with the requested Service. Must have no overlapping `Blocker` or active `Booking` in the span `[slot_start, cleanup_end_time)`.
- **Therapists:** Must be explicitly compatible with the requested Service. Must be actively on a `TherapistShift` that covers the entire span `[slot_start, service_end_time)`. Must have no overlapping `Blocker` or active `Booking`. Therapist is assumed free during `cleanup_end_time`.

## Advisory Nature of Outputs
The algorithm flags every generated slot with `is_advisory: true`. The Availability Engine provides a momentary snapshot. 

> [!WARNING]
> **Transactional Re-check Required**
> In Phase K-4, the `POST /bookings` endpoint MUST perform a DB-level transactional lock or collision re-check. An advisory slot is never a guarantee of booking fulfillment.
