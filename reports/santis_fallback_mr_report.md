# Santis OS - Airtable Fallback MR Report (Read-Only)
**Date:** 2026-06-17
**Context:** Airtable Meta API schema endpoint returns 403 in local PAT context.
**Mode:** Fallback Mode (Local evidence only). 
**Primary MR Delegation:** ChatGPT Airtable Connector (OAuth/Native).

## 1. Local Evidence Overview
- **Source:** `airtable_dump.json`, `santis_airtable_preflight_snapshot.md`, `santis_airtable_debt_summary.json`
- **Total Inferred Bookings:** 31 records found in local dump.
- **Unique Fields Detected in Dump:** 54 fields.

## 2. Constraints & Compliance (Antigravity Policy)
- ✅ **Use Airtable REST data API only.**
- ✅ **Pull sample records from known canonical tables.**
- ✅ **Infer operational field presence from returned records.**
- ✅ **Use local JSON/MD snapshots as evidence.**
- 🚫 **Do not attempt schema mutation.**
- 🚫 **Do not create/delete fields.**
- ✅ **Produce read-only MR report only.**

## 3. Canonical Tables Acknowledged
The following tables are acknowledged as the canonical CoreState data layer of Santis OS. Schema mapping for these tables will be handled via the primary ChatGPT Connector.

- Bookings
- Clients
- Payments
- Therapists
- Rooms
- Services
- Locations
- Package_Catalog
- Client_Packages
- Package_Usage_Ledger
- Inventory
- Inventory_Transactions
- Live_Operation_Lock
- Technical_Debt_Ledger
- Commission Rules
- Commission Ledger
- Service Consumption Rules
- Revenue_Dashboard
- Backup_Offline_Log
- Offline_Daily_Schedule_Exports

## 4. Operational Status
- **LOCK-08:** `LOCKED / VERIFIED` (Offline Backup Verified)
- **Pending Locks to Close:** LOCK-06, LOCK-07, LOCK-11
- **Go-Live Gate:** LOCK-12 is `Blocked`.

---
*End of Report.*
