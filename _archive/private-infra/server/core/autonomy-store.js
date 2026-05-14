import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const STORAGE_DIR = path.resolve(process.cwd(), "storage");
const LEDGER_PATH = path.join(STORAGE_DIR, "autonomy-ledger.jsonl");
const DEFAULT_TENANT_ID = "tn_santis_club";

function ensureStorage() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function appendRecord(record) {
  ensureStorage();
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(record) + "\n", "utf8");
}

function parseRecord(line) {
  try {
    const parsed = JSON.parse(line);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readRecords() {
  ensureStorage();

  if (!fs.existsSync(LEDGER_PATH)) {
    return [];
  }

  return fs
    .readFileSync(LEDGER_PATH, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseRecord)
    .filter(Boolean)
    .sort((left, right) => {
      const leftTimestamp = typeof left.timestamp === "number" ? left.timestamp : 0;
      const rightTimestamp = typeof right.timestamp === "number" ? right.timestamp : 0;
      return rightTimestamp - leftTimestamp;
    });
}

function toNonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toConfidencePercent(value) {
  const numeric = toFiniteNumber(value);
  if (numeric == null) {
    return 99;
  }

  if (numeric <= 1) {
    return Math.round(Math.max(0, Math.min(1, numeric)) * 100);
  }

  return Math.round(Math.max(0, Math.min(100, numeric)));
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toISOString().replace("T", " ").substring(0, 19);
}

function buildAutoAppliedLedgerEntry(record) {
  const kind = toNonEmptyString(record.kind) || "AUTO_PRICE_ADJUSTED";
  const ritualTitle =
    toNonEmptyString(record.ritualTitle) ||
    toNonEmptyString(record.ritualId) ||
    "Unknown Ritual";
  const multiplier = toFiniteNumber(record.multiplier);

  const title =
    kind === "AUTONOMOUS_ROLLBACK"
      ? `Autonomous rollback restored ${ritualTitle} to base pricing`
      : multiplier != null
        ? `Autonomous corridor applied ${ritualTitle} x${multiplier.toFixed(2)}`
        : `Autonomous corridor applied ${ritualTitle}`;

  return {
    timestamp: formatTimestamp(
      typeof record.timestamp === "number" ? record.timestamp : Date.now()
    ),
    actionId:
      toNonEmptyString(record.actionId) ||
      `autonomy:${toNonEmptyString(record.id) || randomUUID()}`,
    title,
    status: "SYSTEM_AUTO_APPLY",
    operator: "SOVEREIGN_KERNEL",
    hash: toNonEmptyString(record.hash) || `AUTO-${record.id || randomUUID()}`,
    confidence: toConfidencePercent(record.confidence),
  };
}

function buildActivePositionMap(records) {
  const ordered = [...records].sort((left, right) => {
    const leftTimestamp = typeof left.timestamp === "number" ? left.timestamp : 0;
    const rightTimestamp = typeof right.timestamp === "number" ? right.timestamp : 0;
    return leftTimestamp - rightTimestamp;
  });

  const active = new Map();

  for (const record of ordered) {
    const ritualId = toNonEmptyString(record.ritualId);
    if (!ritualId) {
      continue;
    }

    if (record.kind === "AUTO_PRICE_ADJUSTED") {
      active.set(ritualId, record);
      continue;
    }

    if (record.kind === "AUTONOMOUS_ROLLBACK") {
      active.delete(ritualId);
    }
  }

  return active;
}

function buildAutoRecord(input) {
  return {
    id: input.id || randomUUID(),
    kind: "AUTO_PRICE_ADJUSTED",
    timestamp: typeof input.timestamp === "number" ? input.timestamp : Date.now(),
    actionId:
      toNonEmptyString(input.actionId) || `autonomy:${randomUUID()}:apply`,
    advisoryId: toNonEmptyString(input.advisoryId),
    ritualId: toNonEmptyString(input.ritualId),
    ritualTitle: toNonEmptyString(input.ritualTitle),
    tenantId: toNonEmptyString(input.tenantId) || DEFAULT_TENANT_ID,
    multiplier: toFiniteNumber(input.multiplier),
    previousPrice: toFiniteNumber(input.previousPrice),
    newPrice: toFiniteNumber(input.newPrice),
    occupancyPercent: toFiniteNumber(input.occupancyPercent),
    signalSource: toNonEmptyString(input.signalSource) || "OCCUPANCY",
    policyId: toNonEmptyString(input.policyId) || "NARROW_CORRIDOR_V1",
    gatewayMode: toNonEmptyString(input.gatewayMode) || "DIRECT",
    confidence: toFiniteNumber(input.confidence),
    comparator: input.comparator ?? null,
    hash: toNonEmptyString(input.hash) || `AUTO-${randomUUID()}`,
  };
}

function buildRollbackRecord(input) {
  return {
    id: input.id || randomUUID(),
    kind: "AUTONOMOUS_ROLLBACK",
    timestamp: typeof input.timestamp === "number" ? input.timestamp : Date.now(),
    actionId:
      toNonEmptyString(input.actionId) || `autonomy:${randomUUID()}:rollback`,
    originalActionId: toNonEmptyString(input.originalActionId),
    ritualId: toNonEmptyString(input.ritualId),
    ritualTitle: toNonEmptyString(input.ritualTitle),
    tenantId: toNonEmptyString(input.tenantId) || DEFAULT_TENANT_ID,
    previousMultiplier: toFiniteNumber(input.previousMultiplier),
    multiplier: toFiniteNumber(input.multiplier) ?? 1,
    previousPrice: toFiniteNumber(input.previousPrice),
    newPrice: toFiniteNumber(input.newPrice),
    rollbackWindowMinutes: toFiniteNumber(input.rollbackWindowMinutes),
    detailViewDropRatio: toFiniteNumber(input.detailViewDropRatio),
    bookingDropRatio: toFiniteNumber(input.bookingDropRatio),
    triggerMetric: toNonEmptyString(input.triggerMetric) || "HYBRID",
    policyId: toNonEmptyString(input.policyId) || "NARROW_CORRIDOR_V1",
    gatewayMode: toNonEmptyString(input.gatewayMode) || "DIRECT",
    confidence: toFiniteNumber(input.confidence),
    hash: toNonEmptyString(input.hash) || `ROLLBACK-${randomUUID()}`,
  };
}

const AutonomyStore = {
  getLedgerPath() {
    return LEDGER_PATH;
  },

  getRecords() {
    return readRecords();
  },

  recordAutoAdjustment(input) {
    const record = buildAutoRecord(input ?? {});
    appendRecord(record);
    return record;
  },

  recordRollback(input) {
    const record = buildRollbackRecord(input ?? {});
    appendRecord(record);
    return record;
  },

  getActivePosition(ritualId) {
    const normalizedId = toNonEmptyString(ritualId);
    if (!normalizedId) {
      return null;
    }

    return buildActivePositionMap(readRecords()).get(normalizedId) || null;
  },

  getAutoAppliedLedger(limit = 20) {
    return readRecords()
      .filter((record) =>
        record.kind === "AUTO_PRICE_ADJUSTED" ||
        record.kind === "AUTONOMOUS_ROLLBACK"
      )
      .slice(0, limit)
      .map(buildAutoAppliedLedgerEntry);
  },
};

export {
  AutonomyStore,
};
