import type { SovereignEnvelope } from "./telemetry.ts";

/**
 * Örnek tipler.
 * Kendi mevcut dictionary yapına göre isimleri hizala.
 */
export type PersistenceClass = "REQUIRED" | "OPTIONAL" | "EPHEMERAL";
export type RiskClass = "LOW" | "MEDIUM" | "HIGH";

export interface TelemetryPolicy {
  persistence: PersistenceClass;
  risk: RiskClass;
  description: string;
}

type EnvelopeType = "COMMAND" | "EVENT";

type OriginPermissionMatrixType = Record<
  string,
  Partial<Record<EnvelopeType, readonly string[]>>
>;

type PolicyMatrixType = Record<
  EnvelopeType,
  Record<string, TelemetryPolicy>
>;

/**
 * Bu matrisin senin mevcut sözlüğünle uyumlu olması gerekir.
 * Aşağıdakiler örnek anayasal kayıtlar.
 */
export const OriginPermissionMatrix: OriginPermissionMatrixType = {
  NODE_ORCHESTRATOR: {
    COMMAND: [
      "ADJUST_PRICE",
      "EXECUTE_HYDRATION",
      "TRIGGER_REAPER",
    ],
    EVENT: [
      "PRICE_ADJUSTED",
      "UI_MOUNTED",
      "UI_TORN_DOWN",
      "UI_HYDRATED",
      "SHADOW_PRICE_UPDATE",
      "HYBRID_EVALUATION",
      "AUTO_PRICE_ADJUSTED",
      "AUTONOMOUS_ROLLBACK",
      "UPLOAD_INIT_ACCEPTED",
      "UPLOAD_DENIED",
      "UPLOAD_FINALIZED",
      "RESOURCE_SEALED",
    ],
  },
  PYTHON_INTELLIGENCE: {
    COMMAND: [
      "ADJUST_PRICE",
      "TRIGGER_REAPER"
    ],
    EVENT: [
      "ANOMALY_DETECTED",
    ],
  },
  CORE_KERNEL: {
    COMMAND: [
      "TRIGGER_REAPER"
    ],
    EVENT: [
      "SYSTEM_HEALTH_CHANGED",
      "QUEUE_BACKPRESSURE_DETECTED",
      "UI_MOUNTED",
      "UI_TORN_DOWN",
      "UI_HYDRATED",
      "UPLOAD_DENIED"
    ],
  },
  EDGE_ROUTER: {
    EVENT: [
      "UI_MOUNTED"
    ]
  },
  BOARDROOM_UI: {
    COMMAND: [
      "ADJUST_PRICE",
    ],
  }
};

export const TelemetryPolicyMatrix: PolicyMatrixType = {
  COMMAND: {
    ADJUST_PRICE: {
      persistence: "REQUIRED",
      risk: "HIGH",
      description: "Revenue-affecting command",
    },
    EXECUTE_HYDRATION: {
      persistence: "OPTIONAL",
      risk: "LOW",
      description: "UI orchestration command",
    },
    TRIGGER_REAPER: {
      persistence: "REQUIRED",
      risk: "MEDIUM",
      description: "Upload governance decision command",
    },
  },
  EVENT: {
    PRICE_ADJUSTED: {
      persistence: "REQUIRED",
      risk: "HIGH",
      description: "Revenue change completed",
    },
    UI_MOUNTED: {
      persistence: "EPHEMERAL",
      risk: "LOW",
      description: "UI lifecycle mount event",
    },
    UI_TORN_DOWN: {
      persistence: "EPHEMERAL",
      risk: "LOW",
      description: "UI lifecycle teardown event",
    },
    UI_HYDRATED: {
      persistence: "OPTIONAL",
      risk: "LOW",
      description: "UI hydration finished",
    },
    ANOMALY_DETECTED: {
      persistence: "REQUIRED",
      risk: "MEDIUM",
      description: "System anomaly detected",
    },
    SYSTEM_HEALTH_CHANGED: {
      persistence: "REQUIRED",
      risk: "MEDIUM",
      description: "Kernel/system health changed",
    },
    QUEUE_BACKPRESSURE_DETECTED: {
      persistence: "REQUIRED",
      risk: "HIGH",
      description: "Backpressure signal",
    },
    UPLOAD_INIT_ACCEPTED: {
      persistence: "REQUIRED",
      risk: "LOW",
      description: "Upload governance init accepted",
    },
    UPLOAD_DENIED: {
      persistence: "REQUIRED",
      risk: "MEDIUM",
      description: "Upload denied",
    },
    UPLOAD_FINALIZED: {
      persistence: "REQUIRED",
      risk: "LOW",
      description: "Upload finalized",
    },
    RESOURCE_SEALED: {
      persistence: "REQUIRED",
      risk: "MEDIUM",
      description: "Orbital Forge finalize event sealed into sovereign telemetry",
    },
    SHADOW_PRICE_UPDATE: {
      persistence: "REQUIRED",
      risk: "MEDIUM",
      description: "Shadow-mode revenue simulation emitted without mutating live prices",
    },
    HYBRID_EVALUATION: {
      persistence: "REQUIRED",
      risk: "MEDIUM",
      description: "Self-tuning shadow evaluation measured hybrid pricing accuracy against a hard booking outcome",
    },
    AUTO_PRICE_ADJUSTED: {
      persistence: "REQUIRED",
      risk: "HIGH",
      description: "Controlled-autonomy price adjustment executed within the narrow corridor",
    },
    AUTONOMOUS_ROLLBACK: {
      persistence: "REQUIRED",
      risk: "HIGH",
      description: "Autonomous corridor decision rolled back after post-decision degradation",
    }
  },
};

export function assertOriginAuthorized(envelope: SovereignEnvelope): void {
  const origin = envelope.payload.origin;
  const type = envelope.type;
  const action = envelope.payload.action;

  const allowedActions = OriginPermissionMatrix[origin]?.[type] ?? [];
  const isAllowed = allowedActions.includes(action);

  if (!isAllowed) {
    throw new Error(
      `[SOVEREIGN_AUTH_VIOLATION] origin=${origin} type=${type} action=${action} id=${envelope.id}`
    );
  }
}

export function getTelemetryPolicyForEnvelope(
  envelope: SovereignEnvelope
): TelemetryPolicy {
  const type = envelope.type;
  const action = envelope.payload.action;

  const policy = TelemetryPolicyMatrix[type]?.[action];

  if (!policy) {
    throw new Error(
      `[SOVEREIGN_POLICY_VIOLATION] Missing policy for type=${type} action=${action} id=${envelope.id}`
    );
  }

  return policy;
}

export function requiresPersistence(envelope: SovereignEnvelope): boolean {
  return getTelemetryPolicyForEnvelope(envelope).persistence === "REQUIRED";
}
