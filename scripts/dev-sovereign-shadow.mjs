import { AdvisoryIngress } from "../server/core/advisory-ingress.ts";

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((entry) => entry.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function readNumberArg(name, fallback) {
  const raw = readArg(name);
  if (raw == null) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

const occupancy = readNumberArg("occupancy", 0.82);
const ritualId = readArg("ritual") ?? "geleneksel-bali";
const tenantId = readArg("tenant") ?? "tn_santis_club";
const guestGenomeScore = readArg("guest-genome");
const dwellTime = readArg("dwell");
const scrollDepth = readArg("scroll");
const detailViews = readArg("detail-views");
const lookaheadHours = readNumberArg("lookahead", 6);
const requestedMultiplier = readArg("multiplier");

const result = await AdvisoryIngress.onOccupancyChange({
  occupancy,
  ritualId,
  tenantId,
  guestGenomeScore:
    guestGenomeScore != null && guestGenomeScore !== ""
      ? Number(guestGenomeScore)
      : undefined,
  guestGenomeMetrics:
    dwellTime != null || scrollDepth != null || detailViews != null
      ? {
          dwellTime: dwellTime != null && dwellTime !== "" ? Number(dwellTime) : 0,
          scrollDepth: scrollDepth != null && scrollDepth !== "" ? Number(scrollDepth) : 0,
          detailViews: detailViews != null && detailViews !== "" ? Number(detailViews) : 0,
        }
      : undefined,
  lookaheadHours,
  requestedMultiplier:
    requestedMultiplier != null && requestedMultiplier !== ""
      ? Number(requestedMultiplier)
      : undefined,
});

console.log(JSON.stringify(result, null, 2));

if (!result.success) {
  process.exitCode = 1;
}
