import { AutonomyGuard } from "../server/core/autonomy-guard.ts";

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

const ritualId = readArg("ritual") ?? "isvec";
const tenantId = readArg("tenant");
const detailViewDropRatio = readNumberArg("detail-drop");
const bookingDropRatio = readNumberArg("booking-drop");

const result = await AutonomyGuard.evaluateRollbackSignal({
  ritualId,
  tenantId,
  detailViewDropRatio,
  bookingDropRatio,
});

console.log(JSON.stringify(result, null, 2));

if (!result.evaluated) {
  process.exitCode = 1;
}
