import { runWithPrivateServerBoundary } from './helpers/smoke-server-boundary.mjs';

await runWithPrivateServerBoundary({
  context: 'Smoke Phase 5 (Arbitration Kernel)',
  requiredPaths: ['server/core/arbitration/sovereign-kernel.js'],
  run: async () => {
    const { synthesizeSovereignDecision } = await import("../server/core/arbitration/sovereign-kernel.js");

    console.log("🔥 RUNNING CONFLICT TEST 1: VIP Retention vs Pricing Margin");
    const test1 = synthesizeSovereignDecision({
      pricing: {
        score: 90,
        level: "HIGH",
        reasons: ["excessive_discount_margin"],
        suggestedAction: "BLOCK_DISCOUNT",
      },
      vipRisk: {
        score: 85,
        level: "CRITICAL",
        reasons: ["critical_churn_probability"],
        suggestedAction: "IMMEDIATE_HUMAN_ESCALATION",
      },
      ritual: {
        score: 50,
        level: "MEDIUM",
        reasons: ["moderate_adjacency"],
        suggestedAction: "SUBTLE_SUGGESTION",
      },
      flightRisk: { score: 20, level: "LOW" },
    });
    console.log(JSON.stringify(test1, null, 2));

    console.log("\n🏥 RUNNING CONFLICT TEST 2: Health Contraindication Override");
    const test2 = synthesizeSovereignDecision({
      pricing: { score: 10, level: "LOW", reasons: [], suggestedAction: null },
      vipRisk: { score: 10, level: "LOW", reasons: [], suggestedAction: null },
      ritual: {
        score: 0,
        level: "LOW",
        reasons: ["contraindication_pregnancy"],
        suggestedAction: "HIDE_RECOMMENDATION",
      },
      flightRisk: { score: 10, level: "LOW" },
    });
    console.log(JSON.stringify(test2, null, 2));

    if (test1.decision !== "REPRESS_PRICING_FOR_RETENTION") {
      console.error("Test 1 Failed!");
      process.exit(1);
    }
    if (test2.decision !== "DENY_OPERATION") {
      console.error("Test 2 Failed!");
      process.exit(1);
    }

    console.log("\n✅ ALL ARBITRATION CONFLICTS RESOLVED DETERMINISTICALLY.");
  }
});
