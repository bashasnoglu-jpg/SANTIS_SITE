import { runWithPrivateServerBoundary } from './helpers/smoke-server-boundary.mjs';

await runWithPrivateServerBoundary({
  context: 'Dev Sovereign Self Tune',
  requiredPaths: ['server/core/self-tuner.ts'],
  run: async () => {
    const { SelfTuningEngine } = await import("../server/core/self-tuner.ts");

    function readArg(name) {
      const prefix = `--${name}=`;
      const match = process.argv.find((entry) => entry.startsWith(prefix));
      return match ? match.slice(prefix.length) : undefined;
    }

    function readNumberArg(name) {
      const raw = readArg(name);
      if (raw == null || raw === "") {
        return undefined;
      }

      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }

    function readBooleanArg(name, fallback = true) {
      const raw = readArg(name);
      if (raw == null || raw === "") {
        return fallback;
      }

      if (["1", "true", "yes", "booking", "converted"].includes(raw.toLowerCase())) {
        return true;
      }

      if (["0", "false", "no", "bounce", "rejected"].includes(raw.toLowerCase())) {
        return false;
      }

      return fallback;
    }

    const ritualId = readArg("ritual") ?? "geleneksel-bali";
    const tenantId = readArg("tenant");
    const outcomeId = readArg("outcome-id");
    const occurredAt = readNumberArg("occurred-at");
    const maxShadowAgeHours = readNumberArg("hours");
    const converted = readBooleanArg("converted", true);

    const result = await SelfTuningEngine.evaluateBookingOutcome({
      ritualId,
      tenantId,
      outcomeId,
      occurredAt,
      maxShadowAgeHours,
      converted,
    });

    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      process.exitCode = 1;
    }
  }
});
