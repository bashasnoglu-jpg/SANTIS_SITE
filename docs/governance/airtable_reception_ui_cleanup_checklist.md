# Airtable 90 ADMIN View Overload - UI Cleanup Checklist

## 1. Current Problem
Airtable is acting as the single source of truth (CoreState SSOT). However, the "everything tool" anti-pattern has caused severe UI clutter. The Reception Interface is currently overloaded with `90 ADMIN`, setup, technical debt, and governance views. 
Daily reception users risk accidentally viewing Test/Archive records or interacting with legacy data, which can lead to operational errors (e.g., check-in mistakes, incorrect calendar readings, or payment discrepancies).

## 2. Reception Pages To Keep
These are the **only** pages that should remain visible in the `00 RECEPTION` Interface group for daily users. Every page below must have a strict `Environment = Live` filter applied.

1. 00 RECEPTION — Dashboard
2. 01 BUDVA — Live Reception Today
3. 02 PODGORICA — Live Reception Today
4. 03 KOTOR — Live Reception Today
5. 04 TIVAT — Live Reception Today
6. 05 ANTALYA — Live Reception Today
7. Payment Queue
8. Unpaid / Deposit Queue
9. Check-in Queue
10. End of Day Closing
11. Reception Task Queue
12. Reception Action Center

## 3. Admin Pages To Move/Hide
The following view categories must be removed from the Reception group and moved to a dedicated `90 ADMIN` or `Setup` Interface group (accessible only to Owners/Admins):

- `90 ADMIN` views
- Setup and Configuration views
- Technical debt and Governance views
- Raw table views (Reception users must not interact with raw tables directly)
- Test/QA views
- Automation control views
- Backup and Admin-only review views
- Legacy migration views

## 4. Field Visibility Rules
In all kept Reception Pages (Bookings, Calendar, Queues), the following field visibility rules apply strictly:

**Visible Fields (SSOT):**
- `Start_DateTime` (The ONLY authorized start time)
- `Calculated_Finish_DateTime` (The ONLY authorized finish time)
- `Status_New`
- `Payment_Status_New`
- `Therapist_Link`, `Room_Link`, `Location_Link`
- Operational fields (e.g., Client Name, Service, Balance)

**Hidden Fields (DO NOT DELETE, ONLY HIDE):**
- `Booking_Date`
- `Start_Time`
- `End_Time`
- `Start Time`
- `End Time`
- `Finish_DateTime`
- `Temp_Start_DateTime_Parse`
- `Temp_Finish_DateTime_Parse`
- `Legacy_Client_Text`
- `Legacy_Service_Collaborator`
- `Legacy_Therapist_Select`
- `Field 61`, `Field 62`, `Field 101`
- `Attachment Summary`
- `Internal_Notes_New`
- `Deposit_Paid`

## 5. Branch Page Naming Standard
To maintain a clear UI architecture, Interface groups and pages should follow this naming convention:
- **Daily Operations:** `00 RECEPTION - [Page Name]`
- **Management/HQ:** `50 HQ - [Page Name]`
- **System Admin:** `90 ADMIN - [Page Name]`
- **Deprecated/Archived:** `Z_ARCHIVE - [Page Name]`

## 6. Manual Airtable Click-by-Click Steps

**Step 6.1: Create Admin Interface Group**
1. Open Airtable Interfaces.
2. Click `Edit` on the top right.
3. Create a new Interface Group/Page category named `90 ADMIN WORKSPACE`.
4. Restrict permissions for this new group to "Owners / Creators" only.

**Step 6.2: Relocate Admin Pages**
1. Identify all setup, test, raw, and governance pages currently visible to Reception.
2. Drag and drop (or change page settings) to move them into the `90 ADMIN WORKSPACE`.

**Step 6.3: Clean Up 00 RECEPTION Group**
1. Go to the `00 RECEPTION` group.
2. Ensure only the 12 approved pages (listed in Section 2) remain.
3. For each of the 12 approved pages, open the filter settings.
4. Add a top-level condition: `AND Environment = Live`.

**Step 6.4: Field Visibility Cleanup (Bookings)**
1. On any Reception page that displays Bookings (Grid, Calendar, Detail view), click `Edit Fields`.
2. Hide all legacy date/time fields (`Booking_Date`, `Start_Time`, `End_Time`, etc.).
3. Ensure `Start_DateTime` and `Calculated_Finish_DateTime` are visible.

**Step 6.5: Publish**
1. Click `Publish` to push the Interface changes to users.

## 7. Verification Checklist
- [ ] No records, fields, or tables were deleted.
- [ ] Reception users logging in only see the `00 RECEPTION` group.
- [ ] Reception users cannot see the `90 ADMIN WORKSPACE`.
- [ ] All 12 Reception pages have `Environment = Live` filter active.
- [ ] Legacy fields (`Booking_Date`, etc.) are completely invisible in Reception detail panels.
- [ ] Start and Finish times are exclusively driven by `Start_DateTime` and `Calculated_Finish_DateTime`.

## 8. Rollback / Safety Rule
**Safety First:** We do NOT delete. If an admin view was accidentally hidden but is needed by reception, simply move it back to the `00 RECEPTION` group. No data loss can occur during this UI organization phase because raw base data is untouched.

## 9. Final Acceptance Criteria
The cleanup is considered successful when a Daily Reception user logs in and experiences a highly focused, clean dashboard containing exactly 12 pages, completely free of testing artifacts, raw legacy fields, and admin setups.
