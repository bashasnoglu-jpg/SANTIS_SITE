import crypto from 'node:crypto';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const EVALUATOR_VERSION = 'SLR-EVAL-0.1.0';
const EVENT_PROCESSOR_VERSION = 'SLR-EVENT-0.1.0';
const DEFAULT_EVENT_TYPE = 'MANUAL_SHADOW_EVALUATION';

const BASE_ID_ENV_KEYS = ['AIRTABLE_BASE_ID', 'AIRTABLE_SANTIS_BASE_ID'];
const TOKEN_ENV_KEYS = ['AIRTABLE_PAT', 'AIRTABLE_API_KEY'];

const TABLES = {
  bookings: process.env.SLR_BOOKINGS_TABLE || 'Bookings',
  events: process.env.SLR_EVENTS_TABLE || 'Operational_Events',
  evaluations: process.env.SLR_EVALUATIONS_TABLE || 'Readiness_Evaluations',
};

const BOOKING_FIELDS = {
  environment: 'Environment',
  tenantLink: 'Tenant_Link',
  locationLink: 'Location_Link',
  finalGate: 'Live_Board_Final_Gate',
  shadowState: 'Shadow_Readiness_State_v0_1',
  shadowReason: 'Shadow_Readiness_Reason_v0_1',
  shadowInputKey: 'Shadow_Readiness_Input_Key_v0_1',
  shadowDivergence: 'Shadow_Readiness_Divergence_v0_1',
  cachedState: 'Operational_Readiness_State',
  cachedVersion: 'Readiness_Version',
  cachedEvaluatedAt: 'Readiness_Evaluated_At',
  cachedTriggerEventLink: 'Readiness_Trigger_Event_Link',
  cachedInputKey: 'Readiness_Input_Key',
};

const EVENT_FIELDS = {
  id: 'Event_ID',
  type: 'Event_Type',
  status: 'Event_Status',
  sourceTable: 'Source_Table',
  sourceRecordId: 'Source_Record_ID',
  subjectType: 'Subject_Type',
  subjectRecordId: 'Subject_Record_ID',
  bookingLink: 'Booking_Link',
  tenantLink: 'Tenant_Link',
  locationLink: 'Location_Link',
  environment: 'Environment',
  occurredAt: 'Occurred_At',
  correlationId: 'Correlation_ID',
  inputFingerprint: 'Input_Fingerprint',
  processorVersion: 'Processor_Version',
  impactCount: 'Impact_Count',
  processedAt: 'Processed_At',
  payloadSummary: 'Payload_Summary',
  shadowOnly: 'Shadow_Only',
  dedupeKey: 'Event_Dedupe_Key',
};

const EVALUATION_FIELDS = {
  id: 'Evaluation_ID',
  bookingLink: 'Booking_Link',
  triggerEventLink: 'Trigger_Event_Link',
  tenantLink: 'Tenant_Link',
  locationLink: 'Location_Link',
  environment: 'Environment',
  previousState: 'Previous_State',
  state: 'Readiness_State',
  reason: 'Primary_Reason_Code',
  reasonSummary: 'Reason_Summary',
  finalGateSnapshot: 'Existing_Final_Gate_Snapshot',
  divergence: 'Divergence_Status',
  evaluatorVersion: 'Evaluator_Version',
  readinessVersion: 'Readiness_Version',
  evaluatedAt: 'Evaluated_At',
  inputFingerprint: 'Input_Fingerprint',
  evidenceSnapshot: 'Evidence_Snapshot',
  evaluationStatus: 'Evaluation_Status',
  shadowOnly: 'Shadow_Only',
  dedupeKey: 'Evaluation_Dedupe_Key',
};

function parseArgs(argv) {
  return argv.reduce((result, arg) => {
    if (!arg.startsWith('--')) return result;
    const [rawKey, ...rawValue] = arg.slice(2).split('=');
    result[rawKey] = rawValue.length > 0 ? rawValue.join('=') : true;
    return result;
  }, {});
}

function firstEnv(keys) {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return null;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required and must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeScalar(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (typeof value.name === 'string') return value.name;
  }
  return String(value).trim();
}

function normalizeLinks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : item?.id))
    .filter((item) => typeof item === 'string' && item.startsWith('rec'));
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function canonicalEnvironment(value) {
  const normalized = normalizeScalar(value);
  if (['Live', 'Test', 'Archive'].includes(normalized)) return normalized;
  throw new Error(`Unsupported Environment value: ${JSON.stringify(value)}`);
}

function canonicalFinalGate(value) {
  const normalized = normalizeScalar(value);
  if (['LIVE READY', 'LIVE REVIEW', 'LIVE BLOCKED'].includes(normalized)) return normalized;
  return 'UNKNOWN';
}

function canonicalState(value) {
  const normalized = normalizeScalar(value);
  if (['READY', 'AT_RISK', 'REVIEW', 'BLOCKED', 'STALE', 'CLOSED'].includes(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported shadow readiness state: ${JSON.stringify(value)}`);
}

function canonicalPreviousState(value) {
  const normalized = normalizeScalar(value);
  if (['READY', 'AT_RISK', 'REVIEW', 'BLOCKED', 'STALE', 'CLOSED'].includes(normalized)) {
    return normalized;
  }
  return 'UNKNOWN';
}

function canonicalDivergence(value) {
  const normalized = normalizeScalar(value);
  if (['NONE', 'SHADOW_STRICTER', 'SHADOW_LOOSER', 'UNCOMPARABLE'].includes(normalized)) {
    return normalized;
  }
  return 'UNCOMPARABLE';
}

function evaluationStatus(divergence) {
  return divergence === 'NONE' ? 'SHADOW_PASS' : 'SHADOW_REVIEW';
}

function deterministicId(prefix, fingerprint, length = 20) {
  return `${prefix}-${fingerprint.slice(0, length).toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function escapeFormulaString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function airtableRequest({ baseId, token, table, path = '', method = 'GET', body = null }) {
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Airtable ${method} failed for ${table}${path}: ${response.status} ${JSON.stringify(payload).slice(0, 700)}`,
    );
  }

  return payload;
}

async function readBooking({ baseId, token, bookingId }) {
  return airtableRequest({
    baseId,
    token,
    table: TABLES.bookings,
    path: `/${bookingId}`,
  });
}

async function findUniqueByDedupeKey({ baseId, token, table, dedupeField, dedupeKey }) {
  const formula = `{${dedupeField}}='${escapeFormulaString(dedupeKey)}'`;
  const query = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: '2',
    pageSize: '2',
  });
  const payload = await airtableRequest({
    baseId,
    token,
    table,
    path: `?${query.toString()}`,
  });
  const records = Array.isArray(payload.records) ? payload.records : [];
  if (records.length > 1) {
    throw new Error(`Duplicate idempotency key detected in ${table}: ${dedupeKey}`);
  }
  return records[0] || null;
}

async function createRecord({ baseId, token, table, fields }) {
  const payload = await airtableRequest({
    baseId,
    token,
    table,
    method: 'POST',
    body: { records: [{ fields }], typecast: false },
  });
  const record = payload.records?.[0];
  if (!record?.id) throw new Error(`Airtable create returned no record for ${table}.`);
  return record;
}

async function ensureSingleRecord({ baseId, token, table, dedupeField, dedupeKey, fields }) {
  const existing = await findUniqueByDedupeKey({ baseId, token, table, dedupeField, dedupeKey });
  if (existing) return { record: existing, created: false };
  const created = await createRecord({ baseId, token, table, fields });
  return { record: created, created: true };
}

async function updateBookingCache({ baseId, token, bookingId, fields }) {
  return airtableRequest({
    baseId,
    token,
    table: TABLES.bookings,
    method: 'PATCH',
    body: { records: [{ id: bookingId, fields }], typecast: false },
  });
}

function buildEvidence(fields, state, reason, divergence, finalGate) {
  return {
    canonical_validity: normalizeScalar(fields.Canonical_Validity_Status),
    branch_guard: normalizeScalar(fields.Branch_Guard_Status),
    authorization_semantic_gate: normalizeScalar(fields['Booking Authorization Semantic Gate']),
    quarantine: normalizeScalar(fields.Quarantine_Status),
    therapist_capability: normalizeScalar(fields.Therapist_Capability_Status),
    room_capability: normalizeScalar(fields.Room_Capability_Status),
    therapist_conflict: normalizeScalar(fields.Therapist_Conflict_Status),
    room_conflict: normalizeScalar(fields.Room_Conflict_Status),
    shift_gate: normalizeScalar(fields['Therapist Shift Gate']),
    final_gate_snapshot: finalGate,
    shadow_state: state,
    shadow_reason: reason,
    divergence,
  };
}

async function evaluateOne({ baseId, token, bookingId, eventType, write }) {
  const booking = await readBooking({ baseId, token, bookingId });
  const fields = booking.fields || {};

  const state = canonicalState(fields[BOOKING_FIELDS.shadowState]);
  const reason = requireString(fields[BOOKING_FIELDS.shadowReason], BOOKING_FIELDS.shadowReason);
  const inputKey = requireString(fields[BOOKING_FIELDS.shadowInputKey], BOOKING_FIELDS.shadowInputKey);
  const divergence = canonicalDivergence(fields[BOOKING_FIELDS.shadowDivergence]);
  const environment = canonicalEnvironment(fields[BOOKING_FIELDS.environment]);
  const finalGate = canonicalFinalGate(fields[BOOKING_FIELDS.finalGate]);
  const tenantLinks = normalizeLinks(fields[BOOKING_FIELDS.tenantLink]);
  const locationLinks = normalizeLinks(fields[BOOKING_FIELDS.locationLink]);
  const previousState = canonicalPreviousState(fields[BOOKING_FIELDS.cachedState]);
  const currentVersion = Number(fields[BOOKING_FIELDS.cachedVersion] || 0);
  const cachedInputKey = normalizeScalar(fields[BOOKING_FIELDS.cachedInputKey]);

  const fingerprint = sha256(inputKey);
  const fingerprintLabel = `sha256:${fingerprint}`;
  const eventDedupeKey = `${EVENT_PROCESSOR_VERSION}|${eventType}|B=${bookingId}|H=${fingerprint}`;
  const evaluationDedupeKey = `${EVALUATOR_VERSION}|B=${bookingId}|H=${fingerprint}`;
  const cacheWriteRequired = cachedInputKey !== inputKey;
  const nextVersion = cacheWriteRequired ? currentVersion + 1 : currentVersion;
  const timestamp = nowIso();
  const evidence = buildEvidence(fields, state, reason, divergence, finalGate);

  const planned = {
    bookingId,
    environment,
    state,
    reason,
    divergence,
    finalGate,
    inputKey,
    fingerprint: fingerprintLabel,
    cacheAction: cacheWriteRequired ? 'WRITE_REQUIRED' : 'NOOP',
    currentVersion,
    nextVersion,
    eventDedupeKey,
    evaluationDedupeKey,
    write,
  };

  if (!write) {
    console.log(JSON.stringify({ mode: 'DRY_RUN', ...planned }, null, 2));
    return planned;
  }

  if (environment !== 'Test') {
    throw new Error(`SLR-EVAL-0.1.0 write mode is Test-only. Booking environment is ${environment}.`);
  }

  if (!cacheWriteRequired) {
    const existingEvent = await findUniqueByDedupeKey({
      baseId,
      token,
      table: TABLES.events,
      dedupeField: EVENT_FIELDS.dedupeKey,
      dedupeKey: eventDedupeKey,
    });
    const existingEvaluation = await findUniqueByDedupeKey({
      baseId,
      token,
      table: TABLES.evaluations,
      dedupeField: EVALUATION_FIELDS.dedupeKey,
      dedupeKey: evaluationDedupeKey,
    });

    const result = {
      mode: 'SHADOW_WRITE',
      ...planned,
      eventRecordId: existingEvent?.id || null,
      evaluationRecordId: existingEvaluation?.id || null,
      eventCreated: false,
      evaluationCreated: false,
      cacheMutated: false,
      noOpProtected: true,
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  const eventFields = {
    [EVENT_FIELDS.id]: deterministicId('EVT-SLR', fingerprint),
    [EVENT_FIELDS.type]: eventType,
    [EVENT_FIELDS.status]: 'IMPACT_RESOLVED',
    [EVENT_FIELDS.sourceTable]: 'Bookings',
    [EVENT_FIELDS.sourceRecordId]: bookingId,
    [EVENT_FIELDS.subjectType]: 'BOOKING',
    [EVENT_FIELDS.subjectRecordId]: bookingId,
    [EVENT_FIELDS.bookingLink]: [bookingId],
    ...(tenantLinks.length > 0 ? { [EVENT_FIELDS.tenantLink]: tenantLinks } : {}),
    ...(locationLinks.length > 0 ? { [EVENT_FIELDS.locationLink]: locationLinks } : {}),
    [EVENT_FIELDS.environment]: environment,
    [EVENT_FIELDS.occurredAt]: timestamp,
    [EVENT_FIELDS.correlationId]: `CORR-SLR-${fingerprint.slice(0, 20)}`,
    [EVENT_FIELDS.inputFingerprint]: fingerprintLabel,
    [EVENT_FIELDS.processorVersion]: EVENT_PROCESSOR_VERSION,
    [EVENT_FIELDS.impactCount]: 1,
    [EVENT_FIELDS.processedAt]: timestamp,
    [EVENT_FIELDS.payloadSummary]: `SLR shadow event; state=${state}; reason=${reason}; divergence=${divergence}; no PII.`,
    [EVENT_FIELDS.shadowOnly]: true,
    [EVENT_FIELDS.dedupeKey]: eventDedupeKey,
  };

  const eventResult = await ensureSingleRecord({
    baseId,
    token,
    table: TABLES.events,
    dedupeField: EVENT_FIELDS.dedupeKey,
    dedupeKey: eventDedupeKey,
    fields: eventFields,
  });

  const evaluationFields = {
    [EVALUATION_FIELDS.id]: deterministicId('RDE-SLR', fingerprint),
    [EVALUATION_FIELDS.bookingLink]: [bookingId],
    [EVALUATION_FIELDS.triggerEventLink]: [eventResult.record.id],
    ...(tenantLinks.length > 0 ? { [EVALUATION_FIELDS.tenantLink]: tenantLinks } : {}),
    ...(locationLinks.length > 0 ? { [EVALUATION_FIELDS.locationLink]: locationLinks } : {}),
    [EVALUATION_FIELDS.environment]: environment,
    [EVALUATION_FIELDS.previousState]: previousState,
    [EVALUATION_FIELDS.state]: state,
    [EVALUATION_FIELDS.reason]: reason,
    [EVALUATION_FIELDS.reasonSummary]: `${EVALUATOR_VERSION} => ${state}; reason=${reason}; divergence=${divergence}.`,
    [EVALUATION_FIELDS.finalGateSnapshot]: finalGate,
    [EVALUATION_FIELDS.divergence]: divergence,
    [EVALUATION_FIELDS.evaluatorVersion]: EVALUATOR_VERSION,
    [EVALUATION_FIELDS.readinessVersion]: nextVersion,
    [EVALUATION_FIELDS.evaluatedAt]: timestamp,
    [EVALUATION_FIELDS.inputFingerprint]: fingerprintLabel,
    [EVALUATION_FIELDS.evidenceSnapshot]: JSON.stringify(evidence),
    [EVALUATION_FIELDS.evaluationStatus]: evaluationStatus(divergence),
    [EVALUATION_FIELDS.shadowOnly]: true,
    [EVALUATION_FIELDS.dedupeKey]: evaluationDedupeKey,
  };

  const evaluationResult = await ensureSingleRecord({
    baseId,
    token,
    table: TABLES.evaluations,
    dedupeField: EVALUATION_FIELDS.dedupeKey,
    dedupeKey: evaluationDedupeKey,
    fields: evaluationFields,
  });

  await updateBookingCache({
    baseId,
    token,
    bookingId,
    fields: {
      [BOOKING_FIELDS.cachedState]: state,
      [BOOKING_FIELDS.cachedVersion]: nextVersion,
      [BOOKING_FIELDS.cachedEvaluatedAt]: timestamp,
      [BOOKING_FIELDS.cachedTriggerEventLink]: [eventResult.record.id],
      [BOOKING_FIELDS.cachedInputKey]: inputKey,
    },
  });

  const result = {
    mode: 'SHADOW_WRITE',
    ...planned,
    eventRecordId: eventResult.record.id,
    evaluationRecordId: evaluationResult.record.id,
    eventCreated: eventResult.created,
    evaluationCreated: evaluationResult.created,
    cacheMutated: true,
    noOpProtected: false,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseId = firstEnv(BASE_ID_ENV_KEYS);
  const token = firstEnv(TOKEN_ENV_KEYS);
  const bookingId = args['booking-id'] || args.bookingId;
  const eventType = args['event-type'] || DEFAULT_EVENT_TYPE;
  const write = args.write === true || args.write === 'true';

  if (!baseId) throw new Error('Missing Airtable base ID. Set AIRTABLE_BASE_ID or AIRTABLE_SANTIS_BASE_ID.');
  if (!token) throw new Error('Missing Airtable token. Set AIRTABLE_PAT or AIRTABLE_API_KEY.');
  if (!bookingId || !String(bookingId).startsWith('rec')) {
    throw new Error('Missing or invalid --booking-id=<rec...>.');
  }

  await evaluateOne({
    baseId,
    token,
    bookingId: String(bookingId),
    eventType: String(eventType),
    write,
  });
}

main().catch((error) => {
  console.error(`❌ SLR shadow evaluator failed: ${error.message}`);
  process.exit(1);
});
