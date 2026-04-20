const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const STORAGE_DIR = path.resolve(process.cwd(), "storage");
const STORE_LOG_PATH = path.join(STORAGE_DIR, "advisory-store.jsonl");
const SUGGESTION_LIMIT = 50;

function ensureStorage() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function appendOperation(operation) {
  ensureStorage();
  fs.appendFileSync(STORE_LOG_PATH, JSON.stringify(operation) + "\n", "utf8");
}

function parseOperation(rawLine) {
  try {
    return JSON.parse(rawLine);
  } catch {
    return null;
  }
}

function readSnapshot() {
  ensureStorage();

  if (!fs.existsSync(STORE_LOG_PATH)) {
    return [];
  }

  const lines = fs
    .readFileSync(STORE_LOG_PATH, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const records = new Map();

  for (const line of lines) {
    const operation = parseOperation(line);
    if (!operation || typeof operation.op !== "string") {
      continue;
    }

    if (operation.op === "upsert" && operation.record && typeof operation.record.id === "string") {
      records.set(operation.record.id, operation.record);
      continue;
    }

    if (operation.op === "remove" && typeof operation.id === "string") {
      records.delete(operation.id);
    }
  }

  return [...records.values()].sort((left, right) => right.createdAt - left.createdAt);
}

function createActionId(id) {
  return `advisory:${id}:apply`;
}

function toFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toNonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createFingerprint(suggestion) {
  const payload = suggestion && typeof suggestion === "object" ? suggestion.executePayload || {} : {};
  return JSON.stringify({
    command: payload.command || null,
    ritualId: payload.ritualId || null,
    multiplier: payload.multiplier || null,
    recommendation: suggestion?.recommendation || null,
    impactArea: suggestion?.impactArea || null,
  });
}

function mapRiskLevel(riskScore) {
  const score = toFiniteNumber(riskScore) ?? 0.2;

  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
}

function buildActionDescription(record) {
  const payload = record.suggestion.executePayload || {};
  const context = record.context || {};
  const advisoryCode = toNonEmptyString(context.advisoryCode) || "SHADOW_PRICE_ADVISORY";
  const ritualId = toNonEmptyString(payload.ritualId) || "unknown-ritual";
  const multiplier = toFiniteNumber(payload.multiplier);
  const originalPrice = toFiniteNumber(context.originalPrice);
  const simulatedPrice = toFiniteNumber(context.simulatedPrice);
  const occupancyPercent = toFiniteNumber(context.occupancyPercent);
  const genomeScore = toFiniteNumber(context.genomeScore);
  const divergence = toFiniteNumber(context.divergence);
  const verdict = toNonEmptyString(context.verdict);

  const segments = [
    advisoryCode === "DESIRE_SURGE_CANDIDATE"
      ? `Oracle detected latent demand for ${ritualId}.`
      : `Oracle sealed a revenue mutation candidate for ${ritualId}.`,
    multiplier != null ? `Suggested multiplier ${multiplier.toFixed(2)}x.` : null,
    originalPrice != null && simulatedPrice != null
      ? `Projected price €${originalPrice.toFixed(2)} -> €${simulatedPrice.toFixed(2)}.`
      : null,
    occupancyPercent != null ? `Signal source observed at ${occupancyPercent.toFixed(1)}% occupancy.` : null,
    genomeScore != null ? `Genome score ${(genomeScore * 100).toFixed(0)}/100.` : null,
    divergence != null && verdict ? `Hybrid verdict ${verdict} (${(divergence * 100).toFixed(1)} bps).` : null,
  ];

  return segments.filter(Boolean).join(" ");
}

function buildAdvisoryItem(record) {
  const suggestion = record.suggestion || {};
  const payload = suggestion.executePayload || {};
  const context = record.context || {};
  const advisoryCode = toNonEmptyString(context.advisoryCode) || "SHADOW_PRICE_ADVISORY";
  const multiplier = toFiniteNumber(payload.multiplier);
  const occupancyPercent = toFiniteNumber(context.occupancyPercent);
  const confidence = toFiniteNumber(context.confidence);
  const risk = mapRiskLevel(suggestion.riskScore);
  const ritualId = toNonEmptyString(payload.ritualId) || "unknown-ritual";
  const ritualLabel = toNonEmptyString(context.ritualTitle) || ritualId;
  const simulatedPrice = toFiniteNumber(context.simulatedPrice);
  const genomeScore = toFiniteNumber(context.genomeScore);

  const thresholdSegments = [];
  if (occupancyPercent != null) {
    thresholdSegments.push(`${occupancyPercent.toFixed(1)}% occupancy`);
  }
  if (genomeScore != null) {
    thresholdSegments.push(`${(genomeScore * 100).toFixed(0)} genome`);
  }

  return {
    id: record.id,
    code: advisoryCode,
    severity:
      advisoryCode === "DESIRE_SURGE_CANDIDATE"
        ? "warning"
        : risk === "high"
          ? "warning"
          : "info",
    title:
      advisoryCode === "DESIRE_SURGE_CANDIDATE"
        ? `${ritualLabel} Desire Surge Candidate`
        : `${ritualLabel} Shadow Advisory`,
    message:
      toNonEmptyString(suggestion.recommendation) ||
      `Oracle prepared a revenue advisory for ${ritualLabel}.`,
    value:
      simulatedPrice != null
        ? `€${simulatedPrice.toFixed(2)}`
        : multiplier != null
          ? `x${multiplier.toFixed(2)}`
          : undefined,
    threshold: thresholdSegments.length ? thresholdSegments.join(" · ") : undefined,
    suggestedAction:
      advisoryCode === "DESIRE_SURGE_CANDIDATE"
        ? "Digital desire exceeds physical load. Review the hybrid exploration surge."
        : "Seal preview ready. Review and approve the sovereign command.",
    timestamp: new Date(record.createdAt).toISOString(),
    actions: [
      {
        id: record.actionId,
        type: "PATCH_PRODUCER_PAYLOAD",
        title:
          advisoryCode === "DESIRE_SURGE_CANDIDATE" && multiplier != null
            ? `Review ${ritualLabel} x${multiplier.toFixed(2)}`
            : multiplier != null
            ? `Apply ${ritualLabel} x${multiplier.toFixed(2)}`
            : `Apply ${ritualLabel} adjustment`,
        description: buildActionDescription(record),
        risk,
        requiresApproval: true,
        suggestedPatch: {
          advisoryId: record.id,
          executePayload: payload,
          shadowContext: context,
        },
        executePayload: payload,
        confidenceScore:
          confidence != null ? Math.round(Math.max(0, Math.min(1, confidence)) * 100) : undefined,
        isAutoDeployable: false,
      },
    ],
  };
}

function buildIntegrity(records) {
  const nowIso = new Date().toISOString();
  const lastUpdatedAt =
    records.length > 0 ? new Date(records[0].createdAt).toISOString() : nowIso;

  return {
    parsed: records.length,
    rejected: 0,
    legacyTransformed: 0,
    matchedOutcomes: 0,
    unmatchedDecisions: records.length,
    lastRejectReason: undefined,
    lastUpdatedAt,
    decisionFamilySplit: {
      PRICING: records.length,
      RISK: 0,
      ROUTING: 0,
      SYSTEM_ORACLE: 0,
      OTHER: 0,
    },
  };
}

const AdvisoryStore = {
  push(suggestion, options = {}) {
    const current = readSnapshot();
    const fingerprint = createFingerprint(suggestion);
    const existing = current.find((record) => record.fingerprint === fingerprint);

    if (existing) {
      return existing;
    }

    const id = options.id || randomUUID();
    const record = {
      id,
      actionId: options.actionId || createActionId(id),
      createdAt: Date.now(),
      source: options.source || "oracle",
      fingerprint,
      suggestion,
      context: options.context || null,
    };

    appendOperation({ op: "upsert", record });

    const nextRecords = [record, ...current].sort((left, right) => right.createdAt - left.createdAt);
    if (nextRecords.length > SUGGESTION_LIMIT) {
      nextRecords.slice(SUGGESTION_LIMIT).forEach((overflowRecord) => {
        appendOperation({ op: "remove", id: overflowRecord.id });
      });
    }

    return record;
  },

  getAll() {
    return readSnapshot();
  },

  getById(id) {
    return readSnapshot().find((record) => record.id === id) || null;
  },

  getByActionId(actionId) {
    return readSnapshot().find((record) => record.actionId === actionId) || null;
  },

  remove(id) {
    const record = this.getById(id);
    if (!record) {
      return false;
    }

    appendOperation({ op: "remove", id });
    return true;
  },

  removeByActionId(actionId) {
    const record = this.getByActionId(actionId);
    if (!record) {
      return false;
    }

    appendOperation({ op: "remove", id: record.id });
    return true;
  },

  buildFeedResponse() {
    const records = readSnapshot();

    return {
      items: [],
      integrity: buildIntegrity(records),
      rejectLedger: [],
      advisories: records.map(buildAdvisoryItem),
      autoAppliedLedger: [],
    };
  },
};

module.exports = {
  AdvisoryStore,
};
