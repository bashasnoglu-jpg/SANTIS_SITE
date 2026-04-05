const intentRepo = require('../repositories/intent-repository');
const visitorRepo = require('../repositories/visitor-repository');
const sessionRepo = require('../repositories/session-repository');

const EVENT_SCORES = {
  'page.view': 2,
  'ritual.start': 8,
  'ritual.service.add': 12,
  'ritual.service.remove': -4,
  'checkout.start': 20,
  'checkout.abandon': -15,
  'intent.hot': 35,
  'intent.flight_risk': -20,
  'intent.flight_risk.soft': -5,
  'package.sold': 50,
};

const SIGNAL_MAP = {
  'intent.hot': { signalType: 'hot_lead', confidence: 0.88 },
  'intent.flight_risk': { signalType: 'flight_risk', confidence: 0.8 },
  'intent.flight_risk.soft': { signalType: 'flight_risk_soft', confidence: 0.25 },
  'checkout.start': { signalType: 'checkout_started', confidence: 0.72 },
  'checkout.abandon': { signalType: 'checkout_abandon', confidence: 0.74 },
};

function clampScore(score) {
  return Math.max(0, Math.min(100, score));
}

function deriveStatus(score) {
  if (score >= 80) return 'hot';
  if (score >= 45) return 'warm';
  return 'cold';
}

async function projectEvent(event) {
  await ensureIdentity(event);

  const nextScore = clampScore(
    (event.currentIntentScore || 0) + (EVENT_SCORES[event.type] || 0)
  );

  let nextStatus = deriveStatus(nextScore);
  
  if (event.type === 'intent.flight_risk.soft' && nextStatus === 'cold') {
      nextStatus = 'suspected'; // doğrudan cold yapma
  }

  // Override confidence for soft flight risk if provided by heuristic
  const dynamicConfidence = event.data?.confidence;

  try {
    await visitorRepo.updateVisitorIntent(event.visitorId, nextScore, nextStatus);
  } catch (err) {
    throw new Error(`visitorRepo.updateVisitorIntent failed: ${err.message}`);
  }

  const signalConfig = SIGNAL_MAP[event.type];
  if (signalConfig) {
    if (!event.sessionId) {
      console.warn(`🛡️ [PROJECTION SHIELD] Skipped intent signal insertion. Reason: Missing sessionId. Visitor: ${event.visitorId}`);
    } else {
      try {
        await intentRepo.insertIntentSignal({
          visitorId: event.visitorId,
          sessionId: event.sessionId,
          signalType: signalConfig.signalType,
          score: nextScore,
          confidence: dynamicConfidence || signalConfig.confidence,
          pagePath: event.page,
          createdAt: event.timestamp,
        });
      } catch (err) {
        throw new Error(`intentRepo.insertIntentSignal failed: ${err.message} | Payload: ${JSON.stringify(event)}`);
      }
    }
  }

  return {
    visitorId: event.visitorId,
    sessionId: event.sessionId,
    intentScore: nextScore,
    status: nextStatus,
  };
}

async function ensureIdentity(event) {
  try {
    await visitorRepo.upsertVisitor(event.visitorId);
  } catch (err) {
    throw new Error(`visitorRepo.upsertVisitor failed: ${err.message}`);
  }

  if (event.sessionId) {
    try {
      await sessionRepo.ensureSession({
          sessionId: event.sessionId,
          visitorId: event.visitorId,
          entryPage: event.page,
          deviceType: event.data?.deviceType || null,
          userAgent: event.data?.userAgent || null,
      });
    } catch (err) {
      throw new Error(`sessionRepo.ensureSession failed: ${err.message}`);
    }
  }

  if (event.type === 'session.started') {
    try {
      await visitorRepo.incrementVisitorSessionCount(event.visitorId);
    } catch (err) {}
  }

  if (event.type === 'session.ended') {
    try {
      await sessionRepo.endSession({
        sessionId: event.sessionId,
        exitPage: event.page,
      });
    } catch (err) {}
  }
}

module.exports = {
  projectEvent,
};
