# Phase K-1: Multi-Tenant Spa Resource Model Architecture

## Status
**PHASE K-1 DESIGN READY / IMPLEMENTATION PENDING**

## Goal
Establish the foundational data model, availability algorithm, and API architecture for a multi-tenant spa SaaS environment. This model strictly supports multi-tenancy, cross-compatibility constraints, and preserves the Phase J-X Auth architecture.

## Approved Foundation
- `Tenant`
- `Location`
- `SpaArea`
- `TreatmentRoom`
- `Therapist`
- `Service`
- `ServiceRoomCompatibility`
- `ServiceTherapistCompatibility`
- `OperatingHours`
- `TherapistShift`
- `Blocker`
- `Booking`

## Architectural Amendments
1. `booking_status` is split from `booking_source`.
2. Time tracking relies on `service_start_time`, `service_end_time`, and `cleanup_end_time`.
3. `TherapistShift` model is separated from generic `OperatingHours`.
4. `TreatmentRoom` includes `room_type` and `capacity`.
5. Slot interval is configurable at the `SpaArea` level (`default_slot_interval_minutes = 15`).
6. Both Zod contracts and Raw SQL migration drafts are produced together.
7. Migrations are drafted but **not applied yet**.
8. Phase J-X Auth architecture remains completely untouched.
9. All scheduling routes will enforce authentication via `boardroomAuthPreHandler`.
10. All models and queries enforce `tenant_id` boundaries.

## Deliverables
- **Zod Contracts**: `packages/domain-schema/src/scheduling.contract.ts`
- **Raw SQL Draft**: `docs/db/phase-k-1-scheduling-schema.sql`
- **Algorithm & Risks**: Defined in this document.

---

## Availability Query Algorithm (Pseudocode)

```python
function getAvailability(tenantId, spaAreaId, serviceId, dateStr):
    # 1. Fetch Config
    spa_area = DB.SpaArea.find(id=spaAreaId, tenant_id=tenantId)
    interval = spa_area.default_slot_interval_minutes
    service = DB.Service.find(id=serviceId, tenant_id=tenantId)
    required_duration = service.duration_minutes + service.cleanup_minutes

    # 2. Scope Valid Resources
    valid_rooms = DB.getRoomsForService(tenantId, serviceId)
    valid_therapists = DB.getTherapistsForService(tenantId, serviceId)
    
    # 3. Retrieve Operational Blocks
    op_hours = DB.getOperatingHours(tenantId, spa_area.location_id, dateStr.dayOfWeek)
    shifts = DB.getTherapistShifts(tenantId, valid_therapists, dateStr)
    
    # 4. Retrieve Conflicts
    blockers = DB.getBlockers(tenantId, valid_rooms, valid_therapists, dateStr)
    bookings = DB.getBookings(tenantId, valid_rooms, valid_therapists, dateStr)
    
    available_slots = []
    
    # 5. Intersect Intervals
    for current_time in range(op_hours.open, op_hours.close, step=interval):
        end_time = current_time + required_duration
        
        # Check if any (Room, Therapist) pair is free for [current_time, end_time]
        found_pair = False
        for room in valid_rooms:
            if isRoomOccupied(room, current_time, end_time, blockers, bookings):
                continue
                
            for therapist in valid_therapists:
                if not isTherapistOnShift(therapist, current_time, end_time, shifts):
                    continue
                if isTherapistOccupied(therapist, current_time, end_time, blockers, bookings):
                    continue
                
                # We found a valid pair
                found_pair = True
                break
                
            if found_pair:
                available_slots.append(current_time)
                break
                
    return available_slots
```

---

## Risk Register Update

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Concurrency / Double Booking** | High | Availability result is strictly advisory. `POST /bookings` must re-check availability inside a DB transaction (using row-level locking or serializable isolation) before insertion. |
| **Cross-Tenant Data Leak** | Critical | All DB queries and Zod schemas forcefully enforce `where: { tenant_id: request.tenant_id }`. RLS policies will be drafted to back up application logic. |
| **Performance Degradation** | Medium | Interval math is CPU-heavy. Intersection checks will be pushed to optimized SQL routines if the dataset scales massively. |
| **Auth Architecture Regression** | High | Reusing `boardroomAuthPreHandler` guarantees safety without modifying Phase J-X logic. |
