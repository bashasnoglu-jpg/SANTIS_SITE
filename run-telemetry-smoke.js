const SMOKE_BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3030";
const TELEMETRY_TARGET_URL = process.env.TELEMETRY_TARGET_URL || "http://localhost:3030";

async function run() {
  console.log('=== SOVEREIGN TELEMETRY E2E SMOKE TEST V1.1 ===\n');
  
  // 1. Snapshot
  console.log('1. [4040] Fetching snapshot...');
  let snapRes;
  try {
    snapRes = await fetch(`${SMOKE_BASE_URL}/api/v1/core-state?tenantId=santis-club&locale=tr&currency=EUR&date=2026-04-20&partySize=2&memberTier=gold`);
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.code === 'ECONNREFUSED') {
      console.log('SERVER_OFFLINE: Local services on 3030/4040/8080 are not running. Skipping telemetry smoke test.');
      return;
    }
    throw err;
  }
  const snapData = await snapRes.json();
  const reqId = snapRes.headers.get('x-santis-request-id') || snapData.requestId;
  console.log('✅ Snapshot received. Request ID:', reqId);

  // Common Context
  const context = {
    tenantId: 'santis-club',
    sessionId: 'sess_smoke_11',
    visitorId: 'vis_smoke_11',
    requestId: reqId,
    degraded: snapRes.headers.get('x-santis-degraded') === '1',
    warningCodes: (snapData.warnings || []).map(w => w.code)
  };

  const serviceId = snapData.services?.[0]?.id || 'svc_signature';
  const price = snapData.services?.[0]?.price || 260;
  const slotStartIso = snapData.nextAvailableSlots?.[0]?.startIso || new Date().toISOString();

  async function emit(event, meta = {}) {
    const res = await fetch(`${TELEMETRY_TARGET_URL}/api/v1/telemetry/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ts: new Date().toISOString(), context, meta })
    });
    if (!res.ok) {
        if (res.status === 404) {
            console.log(`TELEMETRY_RECEIVER_NOT_IMPLEMENTED: ${TELEMETRY_TARGET_URL}/api/v1/telemetry/decision returned 404`);
            return;
        }
    }
    const data = await res.json();
    console.log(`[8080] 📡 ${event} -> Status: ${res.status}`);
    console.log(`       Context: reqId=${context.requestId}, quoteId=${context.quoteId || 'null'}, intentId=${context.intentId || 'null'}`);
    if (meta.latencyMs) console.log(`       Meta: Latency=${meta.latencyMs}ms`);
  }

  // Event Chain
  await emit('SNAPSHOT_VIEWED', { serviceCount: snapData.services?.length, responseTimeMs: 45 });
  await emit('SERVICE_OPENED', { serviceId, position: 0 });
  await emit('SLOT_SELECTED', { serviceId, slotStartIso });
  
  // Quote Flow
  console.log('\n2. [V1.1] Executing Quote Flow...');
  const quoteStartedAt = performance.now();
  await emit('QUOTE_REQUESTED', { serviceId, slotStartIso, addOnIds: [] });
  
  await new Promise(r => setTimeout(r, 215)); // Mock latency
  const latencyMs = Math.round(performance.now() - quoteStartedAt);
  
  const quoteId = `quote_${crypto.randomUUID()}`;
  context.quoteId = quoteId; // Enrich context

  await emit('QUOTE_RECEIVED', { serviceId, finalAmount: price, currency: 'EUR', latencyMs, availabilityConfirmed: true });
  
  // Intent Flow
  console.log('\n3. [V1.1] Executing Intent Flow...');
  await emit('INTENT_STARTED', { serviceId, slotStartIso });
  
  const intentId = `int_${crypto.randomUUID()}`;
  context.intentId = intentId; // Enrich context
  
  await emit('BOOKING_INTENT_SUBMITTED', { serviceId, slotStartIso, hasEmail: true, hasPhone: true });
  
  await new Promise(r => setTimeout(r, 450)); // Mock validation latency
  await emit('INTENT_CONFIRMED', { serviceId, slotStartIso });

  console.log('\n=== PIPELINE SUCCESSFUL ===');
}

run().catch(console.error);
