import * as telemetryRepo from '../repositories/telemetry-repository.js';
import * as visitorRepo from '../repositories/visitor-repository.js';
import * as projectionService from './projection-service.js';

async function ingestEvent(event) {
  try {
    // 🛡️ Ensure Identity exists BEFORE appending to prevent any SQLITE_CONSTRAINT FK violations downstream
    await visitorRepo.upsertVisitor(event.visitorId);
    await telemetryRepo.appendEvent(event);

    setImmediate(async () => {
      try {
        const projection = await projectionService.projectEvent(event);

        console.log('🧠 [PROJECTION]', {
          visitorId: projection.visitorId,
          sessionId: projection.sessionId,
          intentScore: projection.intentScore,
          status: projection.status,
          eventType: event.type,
        });
      } catch (projectionErr) {
        console.warn('⚠️ [PROJECTION ERROR] Failed to project event:', projectionErr.message, '| Event Type:', event.type);
      }
    });
  } catch (err) {
    console.warn('⚠️ [TELEMETRY INGEST ERROR] Failed:', err.message, '| Payload:', JSON.stringify(event));
  }
}

function logDecisionEvent(traceObject) {
  console.log('🧠 [DECISION EVENT]', JSON.stringify(traceObject));
}

export {
  ingestEvent,
  logDecisionEvent,
};
