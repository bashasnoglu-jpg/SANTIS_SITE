import React, { useEffect, useState, useRef } from "react";
import "./BoardroomOracleFeed.css";
import BoardroomAuditLedger, { AuditEntry } from "./BoardroomAuditLedger";
import SovereigntyGauge from "./SovereigntyGauge";
import { generateStrategicReport } from "./ManifestGenerator";
import { audioShield } from "./SovereignAudioEngine";
import SantisConciergeDashboard from "./SantisConciergeDashboard";
import SovereignActionRail from "./SovereignActionRail";
import { ACTION_RAIL_FIXTURES } from "./action-rail.fixtures";
import { useSovereignActionRail } from "./action-rail.hooks";
import type { SovereignAction, DashboardSnapshot } from "../engine/action-engine.types";
import { deriveConciergeActions } from "../engine/action-engine";

const SOVEREIGN_SCHEMA_VERSION = "1.0.0" as const;
const BOARDROOM_BRIDGE_URL = "ws://localhost:4040";

// ─── TİPLER ─────────────────────────────────────────────────────────────
export type TelemetryFeedItem = {
  traceId: string;
  guestId: string;
  decisionType: string;
  decision: string;
  weights: Record<string, number>;
  context: Record<string, unknown>;
  timestamp: string;
  matchedOutcome?: string;
};

export type RejectLedgerItem = {
  id: string;
  endpoint: string;
  reason: string;
  traceId?: string;
  source?: string;
  timestamp: string;
};

export type DecisionFamilySplit = {
  PRICING: number;
  RISK: number;
  ROUTING: number;
  SYSTEM_ORACLE: number;
  OTHER: number;
};

export type FeedIntegrityMeta = {
  parsed: number;
  rejected: number;
  legacyTransformed: number;
  matchedOutcomes: number;
  unmatchedDecisions: number;
  lastRejectReason?: string;
  lastUpdatedAt: string;
  decisionFamilySplit: DecisionFamilySplit;
};

export type AdvisorySeverity = 'info' | 'warning' | 'critical';

export type AdvisoryAction = {
  id: string;
  type: 'PATCH_PRODUCER_PAYLOAD' | 'ADJUST_WEIGHT' | 'THROTTLE_SOURCE' | 'RAISE_ALERT';
  title: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  suggestedPatch?: Record<string, unknown>;
  executePayload?: Record<string, unknown>;
  confidenceScore?: number;
  isAutoDeployable?: boolean;
};

type PriceCommandDraft = {
  ritualId: string;
  multiplier: number;
  reason?: string;
};

type SovereignPriceCommandEnvelope = {
  id: string;
  type: "COMMAND";
  tracking: {
    correlationId: string;
    causationId: string;
  };
  payload: {
    timestamp: number;
    version: typeof SOVEREIGN_SCHEMA_VERSION;
    origin: "BOARDROOM_UI";
    subject: "REVENUE";
    action: "ADJUST_PRICE";
    ritualId: string;
    multiplier: number;
    reason?: string;
    currency: "EUR";
    metadata: Record<string, string | number | boolean>;
  };
};

export type AdvisoryItem = {
  id: string;
  code: string;
  severity: AdvisorySeverity;
  title: string;
  message: string;
  value?: string;
  threshold?: string;
  suggestedAction?: string;
  timestamp: string;
  actions?: AdvisoryAction[];
};

export type FeedResponse = {
  items: TelemetryFeedItem[];
  integrity: FeedIntegrityMeta;
  rejectLedger: RejectLedgerItem[];
  advisories: AdvisoryItem[];
  autoAppliedLedger?: any[];
};

// ─── YARDIMCI METODLAR ──────────────────────────────────────────────────
function timeAgo(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s önce`;
  if (diff < 3600_000) return `${Math.floor(diff / 60000)}m önce`;
  return `${Math.floor(diff / 3600000)}h önce`;
}

function getDominantWeight(weights: Record<string, number>): string {
  if (!weights || Object.keys(weights).length === 0) return "YOK";
  const entries = Object.entries(weights);
  entries.sort((a, b) => b[1] - a[1]);
  return `${entries[0][0]} (${entries[0][1]})`;
}

function riskTone(risk: AdvisoryAction['risk']) {
  switch (risk) {
    case 'high':
      return 'border-red-400/30 bg-red-500/10 text-red-200';
    case 'medium':
      return 'border-[#c6a96b]/30 bg-[#c6a96b]/10 text-[#f1dfb4]';
    default:
      return 'border-white/10 bg-white/[0.03] text-[#d6d6d8]';
  }
}

function severityTone(severity: AdvisorySeverity) {
  switch (severity) {
    case 'critical':
      return 'border-red-400/30 bg-red-500/10 text-red-200';
    case 'warning':
      return 'border-[#c6a96b]/30 bg-[#c6a96b]/10 text-[#f1dfb4]';
    default:
      return 'border-white/10 bg-white/[0.03] text-[#d6d6d8]';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function resolvePriceCommandDraft(action: AdvisoryAction): PriceCommandDraft | null {
  const suggestedPatch = asRecord(action.suggestedPatch);
  const executePayload =
    asRecord(action.executePayload) ??
    asRecord(suggestedPatch?.executePayload);

  if (!executePayload) {
    return null;
  }

  const command =
    toOptionalString(executePayload.command) ??
    toOptionalString(executePayload.action) ??
    (action.type === 'PATCH_PRODUCER_PAYLOAD' ? 'ADJUST_PRICE' : undefined);

  if (command !== 'ADJUST_PRICE') {
    return null;
  }

  const ritualId = toOptionalString(executePayload.ritualId);
  const multiplier = toPositiveNumber(executePayload.multiplier);

  if (!ritualId || multiplier == null) {
    return null;
  }

  return {
    ritualId,
    multiplier: Number(multiplier.toFixed(3)),
    reason:
      toOptionalString(executePayload.reason) ??
      toOptionalString(action.title),
  };
}

function buildPriceCommandEnvelope(action: AdvisoryAction, draft: PriceCommandDraft): SovereignPriceCommandEnvelope {
  const envelopeId = crypto.randomUUID();

  return {
    id: envelopeId,
    type: "COMMAND",
    tracking: {
      correlationId: envelopeId,
      causationId: crypto.randomUUID(),
    },
    payload: {
      timestamp: Date.now(),
      version: SOVEREIGN_SCHEMA_VERSION,
      origin: "BOARDROOM_UI",
      subject: "REVENUE",
      action: "ADJUST_PRICE",
      ritualId: draft.ritualId,
      multiplier: draft.multiplier,
      reason: draft.reason,
      currency: "EUR",
      metadata: {
        source: "boardroom.oracle",
        actionId: action.id,
        risk: action.risk,
        requiresApproval: action.requiresApproval,
      },
    },
  };
}

function buildSealPreview(action: AdvisoryAction): Record<string, unknown> {
  const draft = resolvePriceCommandDraft(action);
  if (!draft) {
    return action.suggestedPatch ?? action.executePayload ?? {};
  }

  return buildPriceCommandEnvelope(action, draft);
}

function AdvisoryStack({
  advisories,
  processedActions,
  isProcessingActionId,
  onViewPatch,
  onApprove,
  onDismiss,
}: {
  advisories: AdvisoryItem[];
  processedActions: Map<string, 'APPROVED' | 'DISMISSED'>;
  isProcessingActionId: string | null;
  onViewPatch: (action: AdvisoryAction) => void;
  onApprove: (id: string, e?: React.MouseEvent) => void;
  onDismiss: (id: string, e?: React.MouseEvent) => void;
}) {
  if (!advisories.length) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#8f9095]">System Advisory</div>
        <div className="mt-3 text-sm text-[#d6d6d8]">System stable. No active advisory pressure detected.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {advisories.slice(0, 4).map((advisory) => (
        <div
          key={advisory.id}
          className={`rounded-3xl border p-5 ${severityTone(advisory.severity)}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] opacity-80">
                {advisory.severity}
              </div>
              <div className="mt-2 text-base font-semibold">{advisory.title}</div>
            </div>
            {advisory.value ? (
              <div className="rounded-full border border-current/20 px-3 py-1 text-xs">
                {advisory.value}
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-7 opacity-90">{advisory.message}</p>

          {advisory.threshold ? (
            <div className="mt-3 text-xs opacity-75">Threshold: {advisory.threshold}</div>
          ) : null}

          {advisory.suggestedAction ? (
            <div className="mt-2 text-xs opacity-75">Guidance: {advisory.suggestedAction}</div>
          ) : null}

          {advisory.actions?.length ? (
            <div className="mt-5 space-y-3">
              {advisory.actions.map((action) => {
                const processedState = processedActions.get(action.id);
                return (
                <div
                  key={action.id}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${processedState ? 'opacity-40 grayscale' : riskTone(action.risk)}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{action.title}</div>
                      <div className="mt-1 text-xs opacity-80">
                        {action.risk.toUpperCase()} RISK · {action.requiresApproval ? 'HACI REQUIRED' : 'DIRECT ACK'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {processedState ? (
                        <span className={`text-xs font-mono flex items-center gap-1 ${processedState === 'APPROVED' ? 'text-emerald-500' : 'text-[#f87171]'}`}>
                           {processedState === 'APPROVED' ? 'DEPLOYED_BY_OPERATOR' : 'DISMISSED'}
                        </span>
                      ) : (
                        <>
                          {action.suggestedPatch ? (
                            <button
                              type="button"
                              onClick={() => onViewPatch(action)}
                              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs transition hover:bg-black/30"
                            >
                              View Patch
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={(e) => onDismiss(action.id, e)}
                            className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs transition hover:bg-black/30"
                            title="Dismiss advisory action"
                          >
                            Dismiss
                          </button>

                          <button
                            type="button"
                            onClick={(e) => onApprove(action.id, e)}
                            disabled={isProcessingActionId === action.id}
                            className={`rounded-2xl border border-white/10 ${isProcessingActionId === action.id ? 'bg-[#c6a96b]/20 text-[#c6a96b]' : 'bg-black/20'} px-3 py-2 text-xs transition hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={action.requiresApproval ? 'Approval required before apply' : 'Acknowledge action'}
                          >
                            {isProcessingActionId === action.id ? 'Deploying...' : (action.requiresApproval ? 'Approve' : 'Acknowledge')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-7 opacity-90">{action.description}</p>
                </div>
              )})}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PatchPreviewModal({
  action,
  isProcessing,
  onApprove,
  onDismiss,
  onClose,
  onSimulate,
  isSimulating,
  simulationResult,
}: {
  action: AdvisoryAction | null;
  isProcessing: boolean;
  onApprove: () => void;
  onDismiss: () => void;
  onClose: () => void;
  onSimulate: () => void;
  isSimulating: boolean;
  simulationResult?: { text: string; message: string; delta: number };
}) {
  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 flex flex-col justify-center items-center pointer-events-auto" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111214] shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-[#8f9095]">Suggested Patch</div>
            <div className="mt-2 text-lg font-semibold text-[#f3f3f4]">{action.title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-[#d6d6d8]"
            title="Close patch preview"
          >
            Kapat
          </button>
        </div>

        <div>
          <p className="mb-4 text-sm leading-7 text-[#d6d6d8]">{action.description}</p>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#d6d6d8]">
              Risk: {action.risk.toUpperCase()}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#d6d6d8]">
              {action.requiresApproval ? 'HACI REQUIRED' : 'DIRECT ACK'}
            </span>
          </div>

          <pre className="overflow-auto rounded-2xl border border-white/5 bg-black/30 p-4 text-xs leading-6 text-[#d6d6d8]">
{JSON.stringify(buildSealPreview(action), null, 2)}
          </pre>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/5 pt-5">
             <div className="flex-1 flex items-center">
               {simulationResult ? (
                  <div className={`text-[11px] font-mono leading-tight ${simulationResult.delta < 0 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : 'text-[#60a5fa] drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]'}`}>
                    <strong className="text-sm block mb-1">{simulationResult.text}</strong>
                    <span className="opacity-80">{simulationResult.message}</span>
                  </div>
               ) : (
                  <button onClick={onSimulate} disabled={isSimulating || isProcessing} className="px-4 py-2 border border-blue-400/30 bg-blue-400/10 rounded-xl text-sm transition hover:bg-blue-400/20 text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto text-left flex items-center gap-2">
                    {isSimulating ? 'Simulating Neural Impact...' : 'Predict Stability Impact'}
                  </button>
               )}
             </div>
             
             <div className="flex justify-end gap-3 shrink-0">
               <button onClick={onDismiss} disabled={isProcessing} className="px-4 py-2 border border-white/10 rounded-xl text-sm transition hover:bg-white/5 text-[#d6d6d8] focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                 Dismiss
               </button>
               <button onClick={onApprove} disabled={isProcessing} className="px-4 py-2 border border-[#c6a96b]/50 bg-[#c6a96b]/10 rounded-xl text-sm transition hover:bg-[#c6a96b]/20 text-[#f1dfb4] focus:outline-none focus:ring-1 focus:ring-[#c6a96b]/50 disabled:opacity-50 disabled:cursor-not-allowed">
                 {isProcessing ? 'Deploying to Kernel...' : (action.requiresApproval ? 'Approve Patch' : 'Acknowledge Action')}
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ANA BİLEŞEN ────────────────────────────────────────────────────────
export default function BoardroomOracleFeed() {
  const bridgeRef = useRef<WebSocket | null>(null);
  const bridgeReconnectTimerRef = useRef<number | null>(null);
  const bridgeShouldReconnectRef = useRef(true);
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [actionSnapshot, setActionSnapshot] = useState<DashboardSnapshot | null>(null);

  const {
    actions: railActions,
    stats: railStats,
    acknowledge: railAcknowledge,
    reject: railReject,
    approve: railApprove,
    setActions: setRailActions,
  } = useSovereignActionRail([], async (action) => {
    console.log("[HACI] applying patch", action);
    await new Promise((resolve) => setTimeout(resolve, 700));
    return {
      ok: true,
      patchId: `patch_${Date.now()}`,
      appliedAt: new Date().toISOString(),
    };
  });

  useEffect(() => {
    (window as any).__SANTIS_TEST__ = {
      injectDropSpike: () => {
        const snap: DashboardSnapshot = {
          dropRate: 12.4,
          completionRate: 61.8,
          conciergeRate: 3.2,
          premiumInterestRate: 8.1,
          hotStep: "q2",
        };
        setActionSnapshot(snap);
        setRailActions(deriveConciergeActions(snap));
        audioShield.playDangerAlert();
      },
      loadFixtures: () => {
        setRailActions(ACTION_RAIL_FIXTURES);
      }
    };
  }, [setRailActions]);

  const [items, setItems] = useState<TelemetryFeedItem[]>([]);
  const [integrity, setIntegrity] = useState<FeedIntegrityMeta | null>(null);
  const [rejectLedger, setRejectLedger] = useState<RejectLedgerItem[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<AdvisoryAction | null>(null);
  const [processedActions, setProcessedActions] = useState<Map<string, 'APPROVED' | 'DISMISSED'>>(new Map());
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isProcessingActionId, setIsProcessingActionId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  const [simulationResults, setSimulationResults] = useState<Record<string, { delta: number; message: string; text: string }>>({});
  const [isSimulatingId, setIsSimulatingId] = useState<string | null>(null);
  const [projectedScore, setProjectedScore] = useState<number | null>(null);

  const processedActionsRef = useRef(processedActions);
  useEffect(() => {
    processedActionsRef.current = processedActions;
  }, [processedActions]);

  const calculateSovereigntyScore = (advisoriesList: AdvisoryItem[]) => {
    let score = 100;
    advisoriesList.forEach(adv => {
      if (adv.actions && adv.actions.length > 0) {
        adv.actions.forEach(action => {
          if (action.risk === 'high') score -= 15;
          else if (action.risk === 'medium') score -= 10;
          else if (action.risk === 'low') score -= 5;
        });
      }
    });
    return Math.max(score, 0);
  };
  
  const stabilityScore = calculateSovereigntyScore(advisories);

  const addToLedger = (actionId: string, status: 'APPROVED' | 'DISMISSED') => {
    let matchedAction: AdvisoryAction | undefined;
    for (const adv of advisories) {
      if (adv.actions) {
        matchedAction = adv.actions.find(a => a.id === actionId);
        if (matchedAction) break;
      }
    }

    const title = matchedAction ? matchedAction.title : `Action ${actionId.substring(0,8)}`;

    const newEntry: AuditEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actionId: actionId,
      title: title,
      status: status,
      operator: 'SOVEREIGN_ADMIN',
      hash: Math.random().toString(16).substring(2, 10).toUpperCase()
    };
    
    setAuditLog(prev => [newEntry, ...prev]);
  };

  const findActionById = (actionId: string): AdvisoryAction | null => {
    if (selectedAction?.id === actionId) {
      return selectedAction;
    }

    for (const advisory of advisories) {
      const matched = advisory.actions?.find(action => action.id === actionId);
      if (matched) {
        return matched;
      }
    }

    return null;
  };

  const scheduleBridgeReconnect = () => {
    if (!bridgeShouldReconnectRef.current) {
      return;
    }

    if (bridgeReconnectTimerRef.current != null) {
      return;
    }

    bridgeReconnectTimerRef.current = window.setTimeout(() => {
      bridgeReconnectTimerRef.current = null;
      connectBridge();
    }, 2500);
  };

  const connectBridge = () => {
    if (
      bridgeRef.current &&
      (bridgeRef.current.readyState === WebSocket.OPEN ||
        bridgeRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const ws = new WebSocket(BOARDROOM_BRIDGE_URL);
      bridgeRef.current = ws;

      ws.onopen = () => {
        setBridgeOnline(true);
        console.log("[BOARDROOM_BRIDGE] Sovereign command uplink active.");
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet?.type === 'COMMAND_REJECTED') {
            setError(`COMMAND_REJECTED: ${packet.payload?.reason ?? 'UNKNOWN_REASON'}`);
          }
        } catch (_) {
          // Non-command packets can pass silently through the bridge.
        }
      };

      ws.onclose = () => {
        setBridgeOnline(false);
        bridgeRef.current = null;
        if (bridgeShouldReconnectRef.current) {
          scheduleBridgeReconnect();
        }
      };

      ws.onerror = () => {
        setBridgeOnline(false);
      };
    } catch (error) {
      console.error("[BOARDROOM_BRIDGE] WebSocket bootstrap failed:", error);
      setBridgeOnline(false);
      scheduleBridgeReconnect();
    }
  };

  const handleApprove = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log(`[Sovereign HACI] Action Approval Initiated: ${id}`);
    setIsProcessingActionId(id);
    const action = findActionById(id);
    const commandDraft = action ? resolvePriceCommandDraft(action) : null;

    if (action && commandDraft && selectedAction?.id !== id) {
      setSelectedAction(action);
      setIsProcessingActionId(null);
      return;
    }

    try {
      if (action && commandDraft) {
        if (!bridgeRef.current || bridgeRef.current.readyState !== WebSocket.OPEN) {
          throw new Error("BRIDGE_OFFLINE");
        }

        const commandEnvelope = buildPriceCommandEnvelope(action, commandDraft);
        bridgeRef.current.send(JSON.stringify(commandEnvelope));
        addToLedger(id, 'APPROVED');
        setProcessedActions(prev => new Map(prev).set(id, 'APPROVED'));
        setAdvisories(prev => prev.filter(adv => !adv.actions?.some(a => a.id === id)));
        console.log(`[BOARDROOM] Sealed command dispatched for ${commandDraft.ritualId}.`);
        setError(null);
        return;
      }

      const res = await fetch("http://localhost:8080/api/v1/telemetry/action/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id })
      });
      const data = await res.json();
      
      if (data.success) {
        addToLedger(id, 'APPROVED');
        setProcessedActions(prev => new Map(prev).set(id, 'APPROVED'));
        // Recovery Effect: İyileşme simülasyonu
        setAdvisories(prev => prev.filter(adv => !adv.actions?.some(a => a.id === id)));
        console.log(`[Sovereign HACI] Kernel sync successful for ${id}`);
      }
    } catch (err) {
      console.error("Kernel deployment failed:", err);
      const message = err instanceof Error ? err.message : "KERNEL_DEPLOYMENT_FAILED";
      setError(message === "BRIDGE_OFFLINE"
        ? "SOVEREIGN BRIDGE OFFLINE - 4040 gateway is not reachable."
        : message);
    } finally {
      setIsProcessingActionId(null);
      setSelectedAction(null);
      setProjectedScore(null);
    }
  };

  const handleDismiss = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    console.log(`[Sovereign HACI] Action Dismissed: ${id}`);
    const action = findActionById(id);
    addToLedger(id, 'DISMISSED');
    setProcessedActions(prev => new Map(prev).set(id, 'DISMISSED'));
    setAdvisories(prev => prev.filter(adv => !adv.actions?.some(a => a.id === id)));

    if (action && resolvePriceCommandDraft(action)) {
      try {
        await fetch("http://localhost:8080/api/v1/telemetry/action/dismiss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: id })
        });
      } catch (error) {
        console.error("Sovereign dismiss sync failed:", error);
      }
    }

    setSelectedAction(null);
    setProjectedScore(null);
  };

  const handleSimulate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    audioShield.playNeuralPulse(); // Tıklandığı an o derin bas vursun
    setIsSimulatingId(id);
    
    try {
      const res = await fetch("http://localhost:8080/api/v1/telemetry/action/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.projectedDelta < 0) {
          audioShield.playDangerAlert(); // Kırmızı uyarı gelince operatörü sarsalım
        }
        setSimulationResults(prev => ({
          ...prev,
          [id]: { delta: data.projectedDelta, message: data.message, text: data.mitigatedScore }
        }));
        setProjectedScore(stabilityScore + data.projectedDelta);
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsSimulatingId(null);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/v1/telemetry/feed");
      if (!res.ok) throw new Error("FEED ULAŞILAMADI");
      const json: FeedResponse = await res.json();
      
      setItems(json.items ?? []);
      setIntegrity(json.integrity ?? null);
      setRejectLedger(json.rejectLedger ?? []);
      
      const freshAdvisories = json.advisories ?? [];
      const filteredAdvisories = freshAdvisories.filter(adv => {
        if (!adv.actions || adv.actions.length === 0) return true;
        // Keep advisory if it has at least one action that is NOT processed, AND is NOT auto deployable
        return adv.actions.some(action => {
            const isProcessed = processedActionsRef.current.has(action.id);
            const isAuto = action.isAutoDeployable;
            return !isProcessed && !isAuto;
        });
      });
      setAdvisories(filteredAdvisories);

      if (json.autoAppliedLedger && json.autoAppliedLedger.length > 0) {
        setAuditLog(prev => {
          const existingHashes = new Set(prev.map(e => e.hash));
          const newEntries = (json.autoAppliedLedger as any[]).filter(e => !existingHashes.has(e.hash));
          if (newEntries.length > 0) {
            console.log(`[HACI] Synced ${newEntries.length} auto-healing events.`);
            audioShield.playSoftChime();
            return [...newEntries, ...prev];
          }
          return prev;
        });
      }
      
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };
  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 4000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bridgeShouldReconnectRef.current = true;
    connectBridge();

    return () => {
      bridgeShouldReconnectRef.current = false;

      if (bridgeReconnectTimerRef.current != null) {
        window.clearTimeout(bridgeReconnectTimerRef.current);
        bridgeReconnectTimerRef.current = null;
      }

      if (bridgeRef.current) {
        bridgeRef.current.close();
        bridgeRef.current = null;
      }
    };
  }, []);

  // Advisory rendering helper inline component deleted directly replaced by AdvisoryStack

  const rejectedCount = integrity?.rejected ?? 0;

  return (
    <div className="oracle-feed-root">
      {/* HEADER: Santis Quiet Luxury Estetiği */}
      <div className="oracle-header-container">
        <div>
          <div className="oracle-header-kicker">SANTIS SOVEREIGN OS</div>
          <div className="oracle-header-title">ORACLE KERNEL TELEMETRY</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className={`oracle-header-status ${error ? "error" : "stable"}`}>
            {error ? `HATA: ${error}` : "PHASE 7.2 LOCK: AKTİF"}
          </div>
          <div className="oracle-header-time">
            SON GÜNCELLEME:{" "}
            {lastRefreshed.toLocaleTimeString("tr-TR", { hour12: false }) +
              "." +
              lastRefreshed.getMilliseconds()}
          </div>
          <div className="oracle-header-time">
            COMMAND BRIDGE: {bridgeOnline ? "4040 ONLINE" : "4040 OFFLINE"}
          </div>
        </div>
      </div>
      
      {/* Strategic Command Operations */}
      <div className="flex justify-between items-center mb-6 px-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
          <div className="text-slate-500 text-[10px] tracking-widest uppercase font-bold">
            Live Neural Feedback Active
          </div>
        </div>
        <button 
          onClick={() => generateStrategicReport(auditLog, stabilityScore)}
          className="group relative px-5 py-2 bg-blue-600/10 border border-blue-500/30 rounded-lg overflow-hidden transition-all hover:bg-blue-600/30 hover:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-blue-300 uppercase tracking-widest relative z-10 group-hover:text-blue-100 transition-colors">
              Export Strategic Manifest
            </span>
          </div>
          {/* Parlama Efekti */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
        </button>
      </div>

      <SovereigntyGauge score={stabilityScore} ghostScore={projectedScore ?? undefined} />

      {/* TRACE INTEGRITY STRIP (ÜST RAIL) */}
      <div className="oracle-metrics-grid">
        <div className="oracle-card">
          <div className="oracle-kicker">PARSED</div>
          <div className="oracle-stat">{integrity?.parsed ?? 0}</div>
        </div>
        <div className="oracle-card" style={{ border: rejectedCount > 0 ? "1px solid #f87171" : undefined }}>
          <div className="oracle-kicker" style={{ color: rejectedCount > 0 ? "#f87171" : undefined }}>REJECTED</div>
          <div className={`oracle-stat ${rejectedCount > 0 ? "oracle-advisory-attention" : ""}`}>
            {rejectedCount}
          </div>
        </div>
        <div className="oracle-card" style={{ border: "1px solid rgba(212, 175, 55, 0.3)" }}>
          <div className="oracle-kicker" style={{ color: "#d4af37" }}>MATCHED OUTCOMES</div>
          <div className="oracle-stat" style={{ color: "#d4af37" }}>{integrity?.matchedOutcomes ?? 0}</div>
        </div>
        <div className="oracle-card">
          <div className="oracle-kicker" style={{ color: "#f59e0b" }}>LEGACY ABSORBED</div>
          <div className="oracle-stat" style={{ color: "#f59e0b" }}>{integrity?.legacyTransformed ?? 0}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "32px" }}>
        
        {/* SOL KOLON: Advisory + Matched Ledger */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Ana Kart 1: Advisory Stack */}
          <div className="oracle-card" style={{ padding: '24px' }}>
            <div className="oracle-kicker" style={{ marginBottom: '24px' }}>ADVISORY STACK - GUIDED AUTONOMY</div>
            <AdvisoryStack 
              advisories={advisories} 
              processedActions={processedActions}
              isProcessingActionId={isProcessingActionId}
              onViewPatch={setSelectedAction} 
              onApprove={handleApprove}
              onDismiss={handleDismiss}
            />
          </div>

          {/* Ana Kart 2: Matched Decision Ledger */}
          <div className="oracle-ledger">
            <div className="oracle-ledger-header">SON 100 CANLI KARAR (LEDGER)</div>
            <table className="oracle-ledger-table">
              <thead>
                <tr>
                  <th className="oracle-ledger-th">TRACE ID</th>
                  <th className="oracle-ledger-th">AİLE</th>
                  <th className="oracle-ledger-th" style={{ color: "#888" }}>KARAR (NİYET)</th>
                  <th className="oracle-ledger-th">AĞIRLIK</th>
                  <th className="oracle-ledger-th oracle-ledger-th-gold">SONUÇ</th>
                  <th className="oracle-ledger-th">ZAMAN</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="oracle-ledger-empty">Veri Yok. Sinyal Bekleniyor.</td>
                  </tr>
                )}
                {items.map((item: TelemetryFeedItem, idx: number) => (
                  <tr key={item.traceId || idx} className="oracle-ledger-tr">
                    <td className="oracle-ledger-td id">{item.traceId}</td>
                    <td className="oracle-ledger-td module">{item.decisionType}</td>
                    <td className="oracle-ledger-td intent">{item.decision}</td>
                    <td className="oracle-ledger-td weight">{getDominantWeight(item.weights)}</td>
                    <td className="oracle-ledger-td outcome">
                      {item.matchedOutcome ? (
                        <span className={item.matchedOutcome.includes("CHURN") ? "oracle-advisory-attention" : "oracle-advisory-success"}>
                          {item.matchedOutcome}
                        </span>
                      ) : (
                        <span className="oracle-advisory-none" style={{ fontStyle: "italic" }}>BEKLENİYOR</span>
                      )}
                    </td>
                    <td className="oracle-ledger-td time">{timeAgo(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Alt mini rail: Feed Meta */}
          {integrity && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontFamily: 'monospace', color: '#6b6b6b' }}>
              <div>LAST UPDATE: {new Date(integrity.lastUpdatedAt).toLocaleTimeString('tr-TR')}</div>
              <div>UNMATCHED DECISIONS: {integrity.unmatchedDecisions}</div>
            </div>
          )}
        </div>

        {/* SAĞ KOLON: Reject Ledger + Decision Family Split */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Decision Family Split */}
          <div className="oracle-card">
            <div className="oracle-kicker">DECISION FAMILY SPLIT</div>
            {integrity?.decisionFamilySplit ? (
              <div className="oracle-ledger-table" style={{ marginTop: '16px', width: '100%' }}>
                {Object.entries(integrity.decisionFamilySplit).map(([family, count]) => (
                  <div key={family} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a', fontSize: '11px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#aaa' }}>{family}</span>
                    <span style={{ color: '#eee', fontWeight: 600 }}>{count as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="oracle-advisory-empty">VERİ YOK</div>
            )}
          </div>

          {/* Reject Ledger */}
          <div className="oracle-ledger">
            <div className="oracle-ledger-header" style={{ color: '#f87171' }}>REJECT LEDGER</div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {rejectLedger.length === 0 ? (
                <div className="oracle-ledger-empty">Sıfır Red. Kusursuz Akış.</div>
              ) : (
                rejectLedger.map((rej) => (
                  <div key={rej.id} style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#6b6b6b', fontFamily: 'monospace' }}>{timeAgo(rej.timestamp)}</span>
                      <span style={{ color: '#888', fontFamily: 'monospace' }}>{rej.endpoint.split('/').pop()?.toUpperCase()}</span>
                    </div>
                    <div style={{ color: '#f87171', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {rej.reason}
                    </div>
                    {rej.traceId && (
                      <div style={{ color: '#444', fontSize: '9px', fontFamily: 'monospace', marginTop: '6px' }}>
                        TRACE: {rej.traceId}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      <BoardroomAuditLedger entries={auditLog} />

      <div className="grid gap-4 md:grid-cols-5 mt-6 px-6">
        <MetricPill label="Total" value={String(railStats.total)} />
        <MetricPill label="New" value={String(railStats.byStatus.new)} />
        <MetricPill label="Seen" value={String(railStats.byStatus.acknowledged)} />
        <MetricPill label="Rejected" value={String(railStats.byStatus.rejected)} />
        <MetricPill label="Applied" value={String(railStats.byStatus.applied)} />
      </div>

      <div className="px-6 mb-6">
        <SovereignActionRail
          actions={railActions}
          onAcknowledge={railAcknowledge}
          onApprove={railApprove}
          onReject={railReject}
        />
      </div>
      <SantisConciergeDashboard />

      <PatchPreviewModal 
        action={selectedAction} 
        isProcessing={isProcessingActionId !== null}
        onApprove={() => selectedAction && handleApprove(selectedAction.id)}
        onDismiss={() => selectedAction && handleDismiss(selectedAction.id)}
        onClose={() => { setSelectedAction(null); setProjectedScore(null); }} 
        onSimulate={() => selectedAction && handleSimulate(selectedAction.id)}
        isSimulating={isSimulatingId === selectedAction?.id}
        simulationResult={selectedAction ? simulationResults[selectedAction.id] : undefined}
      />
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-2 text-[24px] leading-none tracking-[-0.03em] text-[#f4f1ea]">
        {value}
      </div>
    </div>
  );
}
