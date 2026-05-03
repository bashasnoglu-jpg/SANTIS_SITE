import { Router, Request, Response } from "express";
import { z } from "zod";
import { rankRevenueDecisions } from "../revenue/revenue-ranking-engine.js";
import { resolveRevenueDecision } from "../revenue/revenue-decision-engine.js";
import { resolveConflicts } from "../revenue/conflict-resolution-engine.js";
import { resolveTemporalWave } from "../revenue/temporal-wave-engine.js";
import { buildPricingCurve } from "../revenue/pricing-curve-engine.js";
import { applyConstraints, type ConstrainedDecision } from "../revenue/constraint-engine.js";
import { applyPolicy } from "../revenue/policy-engine.js";
import { recordDecision, getLedger } from "../revenue/revenue-audit-ledger.js";

export const revenueRouter: Router = Router();

type RevenueBroadcast = (message: unknown) => void;
let broadcastRevenueMessage: RevenueBroadcast = () => {};

export function setRevenueBroadcaster(broadcaster: RevenueBroadcast) {
  broadcastRevenueMessage = broadcaster;
}

// MOCK source → sonra BoardroomDecision bağlanacak
function getSignals() {
  return [
    {
      decisionId: "rev-demand",
      sessionId: "boardroom-session",
      baseValue: 0.08,
      confidence: 0.82,
      impactWeight: 0.7,
      successRate: 0.75,
      feedbackScore: 0.5,
      hesitationIndex: 30,
    },
    {
      decisionId: "rev-vip",
      sessionId: "boardroom-session",
      baseValue: 0.12,
      confidence: 0.65,
      impactWeight: 0.9,
      successRate: 0.6,
      feedbackScore: 0.2,
      hesitationIndex: 20,
    },
    {
      decisionId: "rev-hesitation",
      sessionId: "boardroom-session",
      baseValue: -0.05,
      confidence: 0.78,
      impactWeight: 0.6,
      successRate: 0.8,
      feedbackScore: 0.7,
      hesitationIndex: 85,
    },
  ];
}

// GET recommendations
revenueRouter.get("/recommendations", async (req: Request, res: Response) => {
  const signals = getSignals();
  const ranked = rankRevenueDecisions(signals);
  const resolved = resolveConflicts(ranked);

  const coreState = {
    boardroom: { vipSessions: 1 }, // mock
    hesitationIndex: 80,
    clinical: { requires_host_review: false }
  };

  const segment =
    coreState.boardroom.vipSessions > 0
      ? "vip"
      : coreState.hesitationIndex > 70
      ? "new_user"
      : "default";

  const temporal = await resolveTemporalWave({
    timestamp: Date.now(),
    demandLevel: "high", // Boardroom/CoreState’ten gelecek
    segment,
  });

  // Mock Constraint Context
  const context = {
    isVip: true, // test VIP override
    medicalAlert: false,
    currentPrice: 100, // mock base price
    priceCeiling: 120, // max 20% increase
    priceFloor: 80, // max 20% decrease
  };

  let final: ConstrainedDecision | null = null;

  if (resolved) {
    const adjustedNet = resolved.netValue * temporal.waveFactor;

    const temporarilyAdjusted = {
      ...resolved,
      netValue: adjustedNet,
      reasoning: [
        ...resolved.reasoning,
        `waveFactor=${temporal.waveFactor.toFixed(4)}`,
        ...temporal.reasoning,
      ],
    };

    final = applyConstraints(temporarilyAdjusted, context);

    if (final && !final.isSuppressed) {
      const policy = applyPolicy({
        action: final.finalAction,
        value: final.netValue,
        segment,
        isVIP: coreState.boardroom.vipSessions > 0,
        medicalAlert: coreState.clinical.requires_host_review,
        priceCeiling: 0.25,
        priceFloor: -0.25,
      });

      if (!policy.allowed) {
        final = {
          ...final,
          isSuppressed: true,
          suppressionReason: policy.reasons[0],
          reasoning: [...final.reasoning, ...policy.reasons],
        } as any;
      } else {
        final = {
          ...final,
          netValue: policy.adjustedValue ?? final.netValue,
          reasoning: [...final.reasoning, ...policy.reasons],
        };
      }

      (final as any).policy = { action: policy.action, reasons: policy.reasons };
    }
  }

  const curve = final ? buildPricingCurve(final.netValue) : null;

  if (final) {
    recordDecision({
      decisionId: final.idempotencyKey,
      input: signals,
      resolved: resolved,
      wave: temporal,
      constraints: context,
      final: final.netValue,
      policy: (final as any).policy,
      timestamp: Date.now(),
    });
  }

  res.json({
    ranked,
    resolved: final,
    temporal,
    curve,
  });
});

// POST override apply
const RevenueOverrideSchema = z.object({
  decisionId: z.string().optional(),
  recommendationId: z.string().optional(),
  sessionId: z.string().optional(),
  action: z.string().optional(),
  reason: z.string().optional(),
  operatorId: z.string().optional(),
  createdAt: z.string().optional(),
});

revenueRouter.post("/override/apply", (req: Request, res: Response) => {
  const parsed = RevenueOverrideSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const payload = parsed.data;

  // WS broadcast hook (type-safe)
  broadcastRevenueMessage({
    type: "REVENUE_OVERRIDE_APPLY_ACK",
    payload,
    ts: Date.now(),
  });

  return res.status(202).json({
    accepted: true,
    ack: "REVENUE_OVERRIDE_APPLY_ACK",
  });
});

// GET audit ledger
revenueRouter.get("/audit", (req: Request, res: Response) => {
  res.json(getLedger());
});

export default revenueRouter;
