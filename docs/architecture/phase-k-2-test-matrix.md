# Phase K-2: Availability Engine Test Matrix

This matrix defines the required unit tests for the Availability Engine before runtime execution begins.

## Core Scenarios

| Scenario | Condition | Expected Outcome |
| :--- | :--- | :--- |
| **Room Conflict** | Target room already has an overlapping `Booking`. | The room is excluded from availability pairs for the overlapping time. |
| **Therapist Conflict** | Target therapist already has an overlapping `Booking`. | The therapist is excluded from availability pairs for the overlapping time. |
| **Cleanup Buffer Conflict** | Target room is free during `service_time` but occupied during `cleanup_end_time`. | Slot is invalid. Both service and cleanup time must fit inside the free interval. |
| **Blocker Conflict** | Target room or therapist has an overlapping `Blocker` (maintenance/sick). | Slot is invalid and excluded from availability pairs. |
| **Outside Operating Hours** | The requested service duration + cleanup spills outside SpaArea `OperatingHours`. | Slot is invalid. Start time and `cleanup_end_time` must fit within open/close bounds. |
| **Therapist Outside Shift** | Therapist has no active `TherapistShift` covering the full slot. | Therapist is excluded from availability. |
| **Incompatible Room** | Room exists and is free, but lacks `ServiceRoomCompatibility` (e.g. Hammam in Massage room). | Room is excluded from checking. |
| **Incompatible Therapist** | Therapist exists and is free, but lacks `ServiceTherapistCompatibility`. | Therapist is excluded from checking. |
| **Cancelled Booking Ignored** | An overlapping booking exists but its `booking_status` is `cancelled`. | The engine ignores it. Slot is marked AVAILABLE. |
| **Tenant Isolation** | A blocker/booking exists for the exact time/room, but belongs to `tenant_B`. | The engine ignores it for `tenant_A`. Slot is marked AVAILABLE for `tenant_A` (Though theoretically impossible if rooms are tenant-bound, this tests the query WHERE clause). |
| **Concurrent Booking Advisory Re-check** | A slot is returned as available. Simultaneously, another process books it. | The `POST /bookings` transactional re-check MUST fail the second booking. The API returns 409 Conflict. |
| **Historical Behavior** | `completed` or `no_show` bookings exist in the past. | Should not affect future availability queries. Handled correctly by date filters. |

## Contract Adherence
- All availability slot responses MUST include `is_advisory: true`.
- The engine MUST return a discrete array of `AvailabilitySlot` objects, quantized by the SpaArea's `default_slot_interval_minutes`.
