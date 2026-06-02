import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ShieldAlert, Zap, Lock } from 'lucide-react';
import { useSovereignWebSocket } from '../hooks/useSovereignWebSocket';
import { useRevenueRecommendations } from '../hooks/useRevenueRecommendations';
import { useStrategy } from '../hooks/useStrategy';

type BoardroomDecisionSeverity = 'low' | 'medium' | 'high' | 'critical';
type BoardroomDecisionReason =
  | 'high_hesitation'
  | 'demand_spike'
  | 'vip_exception'
  | 'pricing_risk'
  | 'clinical_safety'
  | 'system_conflict';
type BoardroomDecisionAction =
  | 'force_reduce_ui'
  | 'handoff_to_human'
  | 'lock_recommendation'
  | 'suppress_upsell'
  | 'freeze_session'
  | 'suggest_price_increase';

type BoardroomRecommendation = {
  id: string;
  sessionId: string;
  severity: BoardroomDecisionSeverity;
  reason: BoardroomDecisionReason;
  action: BoardroomDecisionAction;
  confidence: number;
  impactWeight: number;
  successRate?: number;
  feedbackScore?: number;
  message: string;
  createdAt: string;
};

type RevenueDecision = {
  id: string;
  sessionId: string;
  baseAction: 'price_adjustment' | 'upsell' | 'bundle';
  baseValue: number;
  confidence: number;
  impactWeight: number;
  feedbackScore: number;
  successRate: number;
  finalValue: number;
  reasoning: {
    demandLevel: string;
    hesitationIndex: number;
    sourceDecisionId?: string;
  };
  createdAt: string;
};

const severityClass: Record<BoardroomDecisionSeverity, string> = {
  low: 'border-sovereign-panel text-sovereign-bronze bg-sovereign-coal',
  medium: 'border-sovereign-earth text-sovereign-sand bg-sovereign-earth/10',
  high: 'border-sovereign-accent text-sovereign-accent bg-sovereign-accent/10',
  critical: 'border-red-500 text-red-300 bg-red-950/30',
};

function actionLabel(action: BoardroomDecisionAction) {
  return action.replaceAll('_', ' ');
}

export default function BoardroomActionableFeed() {
  const { latestMessage } = useSovereignWebSocket();
  const [recommendations, setRecommendations] = useState<BoardroomRecommendation[]>([]);
  const { ranked: revenue, resolved: revenueResolved, temporal } = useRevenueRecommendations();
  const strategy = useStrategy();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sealedIds, setSealedIds] = useState<Set<string>>(new Set());
  const [feedbackById, setFeedbackById] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/v1/boardroom/recommendations', {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        if (!cancelled) {
          const nextRecommendations = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
          setRecommendations(nextRecommendations);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown recommendation error');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!latestMessage) {
      return;
    }

    switch (latestMessage.type) {
      case 'OVERRIDE_APPLY_ACK':
        setSealedIds((prev) => new Set(prev).add(latestMessage.recommendationId));
        setBusyId((current) => current === latestMessage.recommendationId ? null : current);
        break;
      case 'FEEDBACK_CALCULATED':
        if (typeof latestMessage.feedbackScore === 'number') {
          setFeedbackById((prev) => ({
            ...prev,
            [latestMessage.decisionId]: latestMessage.feedbackScore,
          }));
        }
        break;
      default:
        break;
    }
  }, [latestMessage]);

  const orderedRecommendations = useMemo(() => {
    const rank: Record<BoardroomDecisionSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...recommendations].sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [recommendations]);

  async function applyOverride(recommendation: BoardroomRecommendation) {
    console.warn('[Sovereign Guard] Command applyOverride is BROKEN and locked. Backend Reality Pending.');
  }

  async function applyRevenueDecision(decision: RevenueDecision) {
    console.warn('[Sovereign Guard] Command applyRevenueDecision is BROKEN and locked. Backend Reality Pending.');
  }

  function formatPercent(value: number) {
    const sign = value > 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}%`;
  }

  return (
    <section className="bg-sovereign-obsidian border border-sovereign-panel rounded-sm p-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 border-b border-sovereign-panel pb-4 mb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-sovereign-accent" />
          <h3 className="text-sm uppercase tracking-widest text-sovereign-ink font-medium">Actionable Feed</h3>
        </div>
        <span className="text-2xs uppercase tracking-widest text-sovereign-bronze">
          Boardroom önerir. Operator mühürler.
        </span>
      </div>

      {error && (
        <div className="mb-4 border border-red-500/40 bg-red-950/20 text-red-200 text-xs px-3 py-2 rounded-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {strategy && (
          <div className="mb-4 border border-sovereign-accent/20 bg-sovereign-coal/30 p-4 rounded-sm">
            <div className="text-xs uppercase tracking-widest text-sovereign-accent mb-3 flex items-center justify-between">
              <span>Strategy Simulation (v3.0)</span>
              <span className="text-xs bg-sovereign-accent/10 px-2 py-0.5 rounded text-sovereign-sand">SAFE AUTONOMY</span>
            </div>

            {strategy.variants.map((v: any) => (
              <div
                key={v.id}
                className={`p-3 mb-2 border rounded-sm flex items-center justify-between ${
                  v.id === strategy.recommendedVariantId
                    ? "border-sovereign-accent/60 bg-sovereign-accent/10"
                    : "border-sovereign-panel/30 opacity-50"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-sovereign-sand">{v.label}</div>
                  <div className="text-xs flex gap-3 mt-1 uppercase tracking-widest">
                    <span className="text-yellow-400">Risk: {v.riskScore.toFixed(2)}</span>
                    <span className="text-blue-400">Conf: {v.confidence.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div className="text-sm font-bold text-green-400">
                    Δ: +€{Math.round(v.expectedDelta)}
                  </div>
                  {v.id === strategy.recommendedVariantId && (
                    <button disabled={true} className="text-xs uppercase tracking-widest border border-sovereign-panel text-sovereign-bronze bg-sovereign-coal opacity-50 px-2 py-1 rounded-sm cursor-not-allowed">
                      Simulate (MOCK)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {orderedRecommendations.length === 0 ? (
          <div className="text-sm text-sovereign-bronze py-6 text-center border border-dashed border-sovereign-panel rounded-sm">
            No boardroom action required.
          </div>
        ) : (
          orderedRecommendations.map((recommendation) => {
            const sealed = sealedIds.has(recommendation.id);
            const busy = busyId === recommendation.id;
            const feedbackScore = feedbackById[recommendation.id] ?? recommendation.feedbackScore;
            const successRate = recommendation.successRate;

            return (
              <div key={recommendation.id} className="border border-sovereign-panel bg-sovereign-coal/50 rounded-sm p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-2xs uppercase tracking-widest border px-2 py-1 rounded-sm ${severityClass[recommendation.severity]}`}>
                        {recommendation.severity}
                      </span>
                      <span className="text-2xs uppercase tracking-widest text-sovereign-bronze">
                        {recommendation.reason.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-sovereign-ink leading-relaxed">{recommendation.message}</p>
                    
                    <div className="mt-4 pt-4 border-t border-sovereign-panel/30">
                      <div className="text-2xs uppercase tracking-widest text-sovereign-accent mb-3">─ ─ ─ Revenue Engine v2.1 Ranking ─ ─ ─</div>
                      
                      <div className="flex flex-col gap-2">
                        {/* PRIMARY */}
                        {revenue.length > 0 && (
                          <div className="border border-sovereign-accent/40 bg-sovereign-accent/5 p-4 rounded-sm flex items-center justify-between">
                            <div>
                              <div className="text-xs text-sovereign-accent uppercase tracking-widest opacity-80 mb-1">Primary Recommendation</div>
                              <div className="text-sm text-sovereign-sand">{revenue[0].decisionId}</div>
                            </div>
                            <div className="text-xl font-semibold text-sovereign-accent">
                              {Math.round(revenue[0].finalValue * 100)}%
                            </div>
                          </div>
                        )}

                        {/* SECONDARY */}
                        {revenue.length > 1 && (
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {revenue.slice(1, 3).map((r) => (
                              <div key={r.decisionId} className="border border-sovereign-panel/30 bg-sovereign-coal/30 p-2 rounded-sm opacity-60 flex items-center justify-between">
                                <div className="text-xs text-sovereign-bronze">{r.decisionId}</div>
                                <div className="text-sm text-sovereign-sand">{Math.round(r.finalValue * 100)}%</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* NET DECISION */}
                        {revenueResolved && (
                          <div className={`border p-4 mt-2 rounded-sm ${revenueResolved.isSuppressed ? 'border-red-500/50 bg-red-950/20' : revenueResolved.finalAction === 'neutral' ? 'border-sovereign-panel/50 bg-sovereign-coal/20 opacity-70' : 'border-sovereign-accent/60 bg-sovereign-accent/10'}`}>
                            <div className="text-xs uppercase tracking-widest opacity-80 mb-1">
                              Net Decision {revenueResolved.isSuppressed && <span className="text-red-400 ml-2">(SUPPRESSED)</span>}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-semibold text-sovereign-ink capitalize">
                                {revenueResolved.finalAction.replaceAll('_', ' ')}
                              </div>
                              <div className="text-base text-sovereign-sand font-medium">
                                {revenueResolved.netValue > 0 ? '+' : ''}{Math.round(revenueResolved.netValue * 100)}%
                              </div>
                            </div>
                            {temporal && !revenueResolved.isSuppressed && (
                              <>
                                <div className="text-xs uppercase tracking-widest text-sovereign-bronze opacity-80 mt-2 border-t border-sovereign-panel/20 pt-2">
                                  wave x{temporal.waveFactor.toFixed(2)}
                                </div>
                                <div className="opacity-30 text-xs">
                                  segment: {temporal.segment}
                                </div>
                              </>
                            )}
                            {revenueResolved.isSuppressed && (
                              <div className="text-xs uppercase tracking-widest text-red-400 opacity-80 mt-2 border-t border-red-500/20 pt-2">
                                constraint: {revenueResolved.suppressionReason?.replaceAll('_', ' ')}
                              </div>
                            )}

                            {revenueResolved.policy && (
                              <div className="text-xs text-red-400 mt-1">
                                policy: {revenueResolved.policy.reasons.join(", ")}
                              </div>
                            )}

                            {/* REASONING EXPLAINABILITY */}
                            <div className="mt-3 text-xs opacity-60 border-t border-sovereign-panel/10 pt-2 space-y-1">
                              {revenueResolved.reasoning.map((line: string, i: number) => (
                                <div key={i} className="font-mono">{line}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
                      <span>Action: {actionLabel(recommendation.action)}</span>
                      <span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
                      <span>Impact: {Math.round(recommendation.impactWeight * 100)}%</span>
                      <span>Success Rate: {typeof successRate === 'number' ? `${Math.round(successRate * 100)}%` : 'New'}</span>
                      <span>Feedback: {typeof feedbackScore === 'number' ? feedbackScore.toFixed(2) : 'Pending'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void applyOverride(recommendation)}
                    disabled={true}
                    className="shrink-0 inline-flex items-center gap-2 border rounded-sm px-3 py-2 text-xs uppercase tracking-widest transition-colors border-sovereign-panel text-sovereign-bronze bg-sovereign-coal opacity-50 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    BACKEND PENDING
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
