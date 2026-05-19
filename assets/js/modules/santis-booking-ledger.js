const STORAGE_KEY = "santis:booking-ledger:v1";

export class SantisBookingLedger {
  static append(entry) {
    try {
      const records = this.list();
      const id = "br_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      
      const newRecord = {
        id,
        type: "booking_confirmation_hold_created",
        ritualTitle: entry.ritualTitle,
        preferredDate: entry.preferredDate,
        preferredTime: entry.preferredTime,
        confirmationMode: entry.confirmationMode || "host-review",
        source: entry.source || "availability-adapter",
        createdAt: Date.now()
      };

      records.push(newRecord);
      
      // Keep only last 20 traces
      if (records.length > 20) {
        records.shift();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      console.log(`[Ledger] Appended booking trace: ${id}`);
    } catch (error) {
      console.warn("[Ledger] Append failed", error);
    }
  }

  static list() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (error) {
      console.warn("[Ledger] List failed", error);
      return [];
    }
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[Ledger] Cleared");
  }
}

function bindLedger() {
  document.addEventListener("guest:booking_confirmation_hold_created", (e) => {
    SantisBookingLedger.append(e.detail);
  });
}

bindLedger();
