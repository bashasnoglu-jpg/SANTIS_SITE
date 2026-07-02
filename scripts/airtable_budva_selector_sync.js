// SANTIS OS LOCK-59 V2 - AUTO — Budva selector sync to canonical
// Shadow Mode | Idempotent | Canonical-Only

// 1. Get Trigger Record ID
let inputConfig = input.config();
let recordId = inputConfig.recordId; // Make sure to map 'recordId' in Automation Input Variables

let bookingsTable = base.getTable("Bookings");
let record = await bookingsTable.selectRecordAsync(recordId);

if (!record) {
    console.error("Booking record not found: ", recordId);
} else {
    // 2. Read Current Values
    let budvaTherapist = record.getCellValue("BUDVA_Therapist_Select");
    let budvaRoom = record.getCellValue("BUDVA_Room_Select");
    let therapistLink = record.getCellValue("Therapist_Link");
    let roomLink = record.getCellValue("Room_Link");
    let canonicalSyncAt = record.getCellValue("Canonical_Sync_At");

    // Helper: Safely compare linked record IDs
    function isSameLink(linkA, linkB) {
        let idA = (linkA && linkA.length > 0) ? linkA[0].id : null;
        let idB = (linkB && linkB.length > 0) ? linkB[0].id : null;
        return idA === idB;
    }

    // 3. Idempotent Guard (Do not override if already synced)
    let isTherapistSynced = isSameLink(budvaTherapist, therapistLink);
    let isRoomSynced = isSameLink(budvaRoom, roomLink);

    if (isTherapistSynced && isRoomSynced && canonicalSyncAt) {
        console.log("Idempotent PASS: Record already synced.");
        await bookingsTable.updateRecordAsync(recordId, {
            "Selector_Sync_Status": { name: "Skipped / Already Synced" }
        });
    } else {
        // 4. Perform Canonical Sync
        let updates = {};
        
        if (budvaTherapist) {
            updates["Therapist_Link"] = [{ id: budvaTherapist[0].id }];
        }
        if (budvaRoom) {
            updates["Room_Link"] = [{ id: budvaRoom[0].id }];
        }

        let nowIso = new Date().toISOString();
        
        updates["Selector_Sync_Status"] = { name: "Success" };
        updates["Canonical_Sync_At"] = nowIso;

        // Shadow Mode: Branch Guard Shadow updates (Optional, based on rules)
        // If the engine expands to update branch guard here:
        updates["Branch_Guard_Status"] = { name: "PASS" };
        updates["Branch_Guard_Reason"] = "Shadow PASS — Selector sync successful and canonical fields updated.";
        updates["Guard_Checked_At"] = nowIso;

        // 5. Write to Airtable
        console.log("Applying canonical sync updates...");
        await bookingsTable.updateRecordAsync(recordId, updates);
        console.log("Sync completed successfully.");
    }
}
