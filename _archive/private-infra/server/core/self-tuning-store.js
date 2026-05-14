import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const STORAGE_DIR = path.resolve(process.cwd(), "storage");
const LEDGER_PATH = path.join(STORAGE_DIR, "self-tuning-ledger.jsonl");

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

function formatWeight(value) {
  const numeric = toFiniteNumber(value);
  return numeric == null ? "n/a" : numeric.toFixed(6);
}

function formatPercent(value) {
  const numeric = toFiniteNumber(value);
  return numeric == null ? "n/a" : `${(numeric * 100).toFixed(1)}%`;
}

function buildLedgerEntry(record) {
  const timestamp =
    typeof record.timestamp === "number"
      ? new Date(record.timestamp).toISOString().replace("T", " ").substring(0, 19)
      : new Date().toISOString().replace("T", " ").substring(0, 19);

  return {
    id: toNonEmptyString(record.id) || randomUUID(),
    timestamp,
    outcomeId: toNonEmptyString(record.outcomeId) || null,
    ritualId: toNonEmptyString(record.ritualId) || "unknown-ritual",
    ritualTitle:
      toNonEmptyString(record.ritualTitle) ||
      toNonEmptyString(record.ritualId) ||
      "Unknown Ritual",
    conversionType: toNonEmptyString(record.conversionType) || "BOOKING",
    converted: Boolean(record.converted),
    predictedConversionProbability: formatPercent(record.predictedConversionProbability),
    suggestedWeightShift: formatWeight(record.suggestedWeightShift),
    currentWeights: `occ ${formatWeight(record.currentOccupancyWeight)} / gen ${formatWeight(record.currentGenomeWeight)}`,
    recommendedWeights: `occ ${formatWeight(record.recommendedOccupancyWeight)} / gen ${formatWeight(record.recommendedGenomeWeight)}`,
    tuningAction: toNonEmptyString(record.tuningAction) || "HOLD_WEIGHTS",
    rationale: toNonEmptyString(record.rationale) || "No tuning rationale recorded.",
    hash: toNonEmptyString(record.hash) || `TUNE-${record.id || randomUUID()}`,
  };
}

const SelfTuningStore = {
  getLedgerPath() {
    return LEDGER_PATH;
  },

  getRecords() {
    return readRecords();
  },

  hasOutcomeId(outcomeId) {
    const normalized = toNonEmptyString(outcomeId);
    if (!normalized) {
      return false;
    }

    return readRecords().some((record) => record.outcomeId === normalized);
  },

  recordEvaluation(input) {
    const record = {
      id: toNonEmptyString(input?.id) || randomUUID(),
      timestamp: typeof input?.timestamp === "number" ? input.timestamp : Date.now(),
      outcomeId: toNonEmptyString(input?.outcomeId),
      ritualId: toNonEmptyString(input?.ritualId),
      ritualTitle: toNonEmptyString(input?.ritualTitle),
      conversionType: toNonEmptyString(input?.conversionType) || "BOOKING",
      converted: Boolean(input?.converted),
      predictedConversionProbability: toFiniteNumber(input?.predictedConversionProbability),
      suggestedWeightShift: toFiniteNumber(input?.suggestedWeightShift),
      currentOccupancyWeight: toFiniteNumber(input?.currentOccupancyWeight),
      currentGenomeWeight: toFiniteNumber(input?.currentGenomeWeight),
      recommendedOccupancyWeight: toFiniteNumber(input?.recommendedOccupancyWeight),
      recommendedGenomeWeight: toFiniteNumber(input?.recommendedGenomeWeight),
      tuningAction: toNonEmptyString(input?.tuningAction) || "HOLD_WEIGHTS",
      matchedShadowEventId: toNonEmptyString(input?.matchedShadowEventId),
      rationale: toNonEmptyString(input?.rationale),
      hash: toNonEmptyString(input?.hash) || `TUNE-${randomUUID()}`,
    };

    appendRecord(record);
    return record;
  },

  getRecentEvaluations(limit = 20) {
    return readRecords().slice(0, limit).map(buildLedgerEntry);
  },
};

export {
  SelfTuningStore,
};
