const STORAGE_KEY = "santis:payment-readiness-ledger:v1";

export class SantisPaymentReadinessLedger {
  static append(payload) {
    try {
      const records = this.list();
      const id = "pr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      
      const newRecord = {
        id,
        type: "payment_eligibility_checked",
        eligible: payload?.paymentEligibility?.eligible || false,
        reason: payload?.paymentEligibility?.reason || "price_required",
        ritualTitle: payload?.ritualTitle,
        confirmationMode: payload?.confirmationMode || "host-review",
        source: "payment-eligibility",
        createdAt: Date.now()
      };

      records.push(newRecord);
      
      // Keep only last 20 traces
      if (records.length > 20) {
        records.shift();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      console.log(`[ReadinessLedger] Appended payment readiness trace: ${id}`);
    } catch (error) {
      console.warn("[ReadinessLedger] Append failed", error);
    }
  }

  static list() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (error) {
      console.warn("[ReadinessLedger] List failed", error);
      return [];
    }
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[ReadinessLedger] Cleared");
  }
}

function bindReadinessLedger() {
  document.addEventListener("guest:payment_eligibility_checked", (e) => {
    SantisPaymentReadinessLedger.append(e.detail);
  });
}

bindReadinessLedger();
