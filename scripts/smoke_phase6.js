import { getSovereignCommand } from "../server/services/decision-service.js";
import { logOutcomeEvent } from "../server/services/telemetry-service.js";

async function runLtvSmokeTest() {
  console.log("🔥 RUNNING LTV TRACE TEST: VIP Margin Push");

  // 1. Otonom Karar Anı
  const decisionResult = await getSovereignCommand("GUEST_VIP_001", {
    pricing: {
      baseCost: 100,
      listedPrice: 200,
      demandScore: 90,
      requestedDiscountPercent: 0,
    },
    vip: {
      complaintCount: 0,
      hasDowngradeRisk: true,
      daysSinceLastVisit: 5,
      isHighSpender: true,
    },
    ritual: {
      currentServices: [],
      recentHistory: [],
      guestProfile: {},
      healthFlags: [],
      candidateService: "Signature Massage",
    },
  });

  console.log(`\n[Test] Sovereign Command Output: `);
  console.log(JSON.stringify(decisionResult, null, 2));

  // O saniyede veri Data Lake'e traceID ile yazıldı.

  // 2. 60 Gün Sonrası (Simülasyon)
  console.log("\n⌛ Simulating 60 Days Later...");

  // VIP misafir Fiyat zorlamasından sonra bir daha "gelmedi" (Sadakat Erozyonu gerçekleşti).
  logOutcomeEvent(decisionResult.traceId, "CHURNED_AFTER_60D");

  console.log("\n✅ THE LTV TRACE COMPLETED.");
  // Shadow Analyzer by Outcome'ları okuduğunda CHURNED olduğu için Advisory (Tavsiye) ateşleyecek.
}

runLtvSmokeTest();
