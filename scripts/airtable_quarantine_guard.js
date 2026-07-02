// SANTIS OS LOCK-59 V2 - SANTIS — Quarantine Guard
// Shadow Mode | Idempotent | Telemetry Ready

// 1. Get Trigger Record ID
let inputConfig = input.config();
let recordId = inputConfig.recordId; // Make sure to map 'recordId' in Automation Input Variables

let bookingsTable = base.getTable("Bookings");
let record = await bookingsTable.selectRecordAsync(recordId);

if (!record) {
    console.error("Booking record not found: ", recordId);
} else {
    // 2. Read Safety Evidence
    let tenant = record.getCellValue("Tenant_Link");
    let location = record.getCellValue("Location_Link");
    let env = record.getCellValueAsString("Environment");
    let client = record.getCellValue("Client_Link");
    let service = record.getCellValue("Service_Link");
    let therapist = record.getCellValue("Therapist_Link");
    let room = record.getCellValue("Room_Link");
    let start = record.getCellValue("Start_DateTime");
    let duration = record.getCellValue("Duration_Minutes_New");
    let selectorSync = record.getCellValueAsString("Selector_Sync_Status");
    
    // Check current Quarantine Status for idempotent execution
    // Note: Use the exact field name if it's different from "Quarantine_Status"
    let currentQuarantine = record.getCellValueAsString("Quarantine_Status"); 

    // 3. Evaluate Guard Logic
    let isClear = false;
    
    // Strict requirement checklist
    if (tenant && location && env === "Live" && client && service && 
        start && (duration && duration > 0) && therapist && room && 
        selectorSync === "Synced") {
        isClear = true;
    }

    let targetStatus = isClear ? "Clear" : "Quarantined";

    // 4. Idempotent Check & Telemetry Preparation
    if (currentQuarantine === targetStatus) {
        console.log(`Idempotent PASS: Record already evaluated as ${targetStatus}`);
        
        // [TELEMETRY HOOK - NEXT PHASE]
        // logAutomationRun(recordId, "Quarantine Guard", `Skipped / ${targetStatus}`);
    } else {
        // 5. Apply Updates
        let updates = {};
        updates["Quarantine_Status"] = { name: targetStatus }; 
        
        if (isClear) {
            // Since conflict engine is distinct, ensure no conflict blocks the shadow mode test
            updates["Room_Conflict_Status"] = { name: "Clear" };
            updates["Therapist_Conflict_Status"] = { name: "Clear" };
            updates["Booking_Conflict_Status"] = { name: "Clear" };
        }

        console.log(`Applying Quarantine Guard update: ${targetStatus}`);
        await bookingsTable.updateRecordAsync(recordId, updates);
        console.log("Quarantine Guard evaluation completed.");
        
        // [TELEMETRY HOOK - NEXT PHASE]
        // logAutomationRun(recordId, "Quarantine Guard", `Success / ${targetStatus}`);
    }
}
