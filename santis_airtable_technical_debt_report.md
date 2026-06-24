# Santis OS Airtable - Technical Debt Report & Roadmap

## Current Status Overview
Airtable is acting as the single source of truth (CoreState SSOT). The data model is extremely strong and robust, but technical debt has accumulated due to the "everything tool" anti-pattern (using Airtable simultaneously as a DB, Admin Panel, Test Area, and Operations Screen). 

## Open Technical Debt & Risks

| Priority | Debt Item | Status | Risk / Impact |
| --- | --- | --- | --- |
| **P0** | Airtable → Santis web admin bridge missing (`GET /api/reception/bookings/today`) | Open | The admin panel cannot read live operations, creating isolated realities. |
| **P0** | Staff_Shifts verification endpoint missing (`GET /api/reception/shifts?date=...`) | Blocked | Live calendar cannot securely verify if a therapist is actively on shift. |
| **P1** | "90 ADMIN" view overload in Reception Interface | Open | Receptionists might see Test/Archive records, leading to check-in/payment errors. |
| **P1** | Commission Ledger backend validation missing | Open | Salary/commission reports cannot be securely locked and validated. |
| **P2** | After Hours automation blocked by Airtable free-plan limit | Blocked | Night shifts or special hours rely on manual snapshots. |
| **P2** | Legacy/Temporary date & text fields visible in Bookings | Controlled | Increases the risk of mapping the wrong field during React integration. |

## Refactoring & Integration Roadmap

**1. Simplify Airtable Reception Screen (Manual/No-Code)**
Hide all "90 ADMIN" and legacy views from the daily user interface. The "00 RECEPTION" view must only contain strictly necessary operational boards (Live Reception, Payment Queues, EOD Closing, Conflicts).

**2. Build Backend Bridge (API Layer)**
Create the proxy endpoints (e.g., `GET /api/reception/bookings/today`) to pipe Airtable CoreState safely into the Santis Admin Calendar. Token remains securely in the backend.

**3. Staff_Shifts Endpoint Integration**
Implement shift validation logic. Bookings must check:
- Same Therapist & Location
- Same Date & Within Shift Hours
- Active/Scheduled Shift Status

**4. Commission Ledger Validation Test**
Write and execute an end-to-end test confirming that a "Completed" booking generates exactly one Commission Ledger record without duplicates.

**5. Legacy Field Cleanup**
Mark legacy fields with a `Z_LEGACY_` prefix or move them to a hidden state to clean up the schema for API mapping.
