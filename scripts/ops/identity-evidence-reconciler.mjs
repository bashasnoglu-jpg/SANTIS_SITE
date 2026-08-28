import {
  CONTRACT_VERSION,
  assertTestEnvironment,
  bookingCachePatch,
  bookingInputFingerprint,
  computeBookingEvidence,
  computeShiftEvidence,
  deterministicRunKey,
  findImpactedBookingIds,
  shiftCachePatch,
  shiftInputFingerprint,
  stableRecordIds,
} from './identity-evidence-reconciler-core.mjs';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID_ENV_KEYS = ['AIRTABLE_BASE_ID', 'AIRTABLE_SANTIS_BASE_ID'];
const TOKEN_ENV_KEYS = ['AIRTABLE_PAT', 'AIRTABLE_API_KEY'];

const TABLES = {
  bookings: process.env.IDENTITY_RECON_BOOKINGS_TABLE || 'tblocCFVgSNfaLAH6',
  shifts: process.env.IDENTITY_RECON_SHIFTS_TABLE || 'tblQjvfz4ljnvCl1R',
  runs: process.env.IDENTITY_RECON_RUNS_TABLE || 'tblZfL6UuOfxz3On1',
};

const FIELDS = {
  booking: {
    environment: 'Environment',
    therapistLink: 'Therapist_Link',
    shiftLink: 'Staff Shift Link',
    sourceSignature: 'Identity_Source_Signature_v0_1',
    reconciledSignature: 'Identity_Reconciled_Source_Signature_v0_1',
    linkedShiftStaffId: 'Linked_Shift_Staff_Record_ID',
    shiftLinkCount: 'Staff_Shift_Link_Count',
  },
  shift: {
    environment: 'Environment',
    staffLink: 'Staff_Link',
    sourceSignature: 'Shift_Identity_Source_Signature_v0_1',
    reconciledSignature: 'Shift_Identity_Reconciled_Source_Signature_v0_1',
    staffRecordId: 'Shift_Staff_Record_ID',
    staffCount: 'Shift_Staff_Count',
  },
  run: {
    name: 'Run Name',
    controlLink: 'Automation_Control_Link',
    status: 'Run_Status',
    environment: 'Environment',
    triggerType: 'Trigger_Type',
    startedAt: 'Run_Started_At',
    finishedAt: 'Run_Finished_At',
    sourceRecordId: 'Source_Record_ID',
    targetRecordId: 'Target_Record_ID',
    resultMessage: 'Result_Message',
    errorLog: 'Error_Log',
    runBy: 'Run_By',
    idempotencyKey: 'Idempotency_Key',
    inputFingerprint: 'Input_Fingerprint',
    namespace: 'Idempotency_Namespace',
    contractVersion: 'Contract_Version',
    attemptNumber: 'Attempt_Number',
    mutationType: 'Mutation_Type',
  },
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
      `Airtable ${method} failed for ${table}${path}: ${response.status} ${JSON.stringify(payload).slice(0, 800)}`,
    );
  }
  return payload;
}

async function readRecord({ baseId, token, table, recordId }) {
  return airtableRequest({ baseId, token, table, path: `/${recordId}` });
}

async function listRecords({ baseId, token, table, fields = [] }) {
  const records = [];
  let offset = null;

  do {
    const query = new URLSearchParams({ pageSize: '100' });
    for (const field of fields) query.append('fields[]', field);
    if (offset) query.set('offset', offset);
    const payload = await airtableRequest({
      baseId,
      token,
      table,
      path: `?${query.toString()}`,
    });
    records.push(...(payload.records || []));
    offset = payload.offset || null;
  } while (offset);

  return records;
}

async function patchRecords({ baseId, token, table, records }) {
  if (records.length === 0) return [];
  const updated = [];
  for (let index = 0; index < records.length; index += 10) {
    const batch = records.slice(index, index + 10);
    const payload = await airtableRequest({
      baseId,
      token,
      table,
      method: 'PATCH',
      body: { records: batch, typecast: false },
    });
    updated.push(...(payload.records || []));
  }
  return updated;
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

async function findUniqueRunByKey({ baseId, token, idempotencyKey }) {
  const formula = `{${FIELDS.run.idempotencyKey}}='${escapeFormulaString(idempotencyKey)}'`;
  const query = new URLSearchParams({ filterByFormula: formula, maxRecords: '2', pageSize: '2' });
  const payload = await airtableRequest({
    baseId,
    token,
    table: TABLES.runs,
    path: `?${query.toString()}`,
  });
  const records = payload.records || [];
  if (records.length > 1) {
    throw new Error(`Duplicate Automation_Runs idempotency key detected: ${idempotencyKey}`);
  }
  return records[0] || null;
}

async function patchRun({ baseId, token, runId, fields }) {
  await patchRecords({
    baseId,
    token,
    table: TABLES.runs,
    records: [{ id: runId, fields }],
  });
}

function requiredWriteContext() {
  const controlRecordId = process.env.IDENTITY_RECON_CONTROL_RECORD_ID;
  if (!controlRecordId || !controlRecordId.startsWith('rec')) {
    throw new Error('IDENTITY_RECON_CONTROL_RECORD_ID=<rec...> is required in write mode.');
  }
  return { controlRecordId };
}

async function readLinkedShifts({ baseId, token, bookingRecord }) {
  const shiftIds = stableRecordIds(bookingRecord.fields?.[FIELDS.booking.shiftLink]);
  const shifts = [];
  for (const shiftId of shiftIds) {
    const shift = await readRecord({ baseId, token, table: TABLES.shifts, recordId: shiftId });
    shifts.push(shift);
  }
  return shifts;
}

async function resolveBookingEvidence({ baseId, token, bookingId }) {
  const booking = await readRecord({ baseId, token, table: TABLES.bookings, recordId: bookingId });
  assertTestEnvironment(booking, `Booking ${bookingId}`);
  const shifts = await readLinkedShifts({ baseId, token, bookingRecord: booking });
  for (const shift of shifts) assertTestEnvironment(shift, `Shift ${shift.id}`);
  const shiftsById = new Map(shifts.map((shift) => [shift.id, shift]));
  return {
    booking,
    shifts,
    evidence: computeBookingEvidence({ bookingRecord: booking, shiftsById }),
  };
}

async function reconcileShift({ baseId, token, shiftId }) {
  const shift = await readRecord({ baseId, token, table: TABLES.shifts, recordId: shiftId });
  assertTestEnvironment(shift, `Shift ${shiftId}`);
  const evidence = computeShiftEvidence(shift);
  const patch = shiftCachePatch(evidence);
  await patchRecords({
    baseId,
    token,
    table: TABLES.shifts,
    records: [{ id: shiftId, fields: patch }],
  });
  return evidence;
}

async function invalidateBookings({ baseId, token, bookingIds }) {
  const uniqueIds = [...new Set(bookingIds)].sort();
  await patchRecords({
    baseId,
    token,
    table: TABLES.bookings,
    records: uniqueIds.map((id) => ({
      id,
      fields: { [FIELDS.booking.reconciledSignature]: null },
    })),
  });
}

async function reconcileBooking({ baseId, token, bookingId, invalidate = true }) {
  if (invalidate) await invalidateBookings({ baseId, token, bookingIds: [bookingId] });

  const initial = await resolveBookingEvidence({ baseId, token, bookingId });
  for (const shift of initial.shifts) await reconcileShift({ baseId, token, shiftId: shift.id });

  const current = await resolveBookingEvidence({ baseId, token, bookingId });
  const patch = bookingCachePatch(current.evidence);
  await patchRecords({
    baseId,
    token,
    table: TABLES.bookings,
    records: [{ id: bookingId, fields: patch }],
  });
  return current.evidence;
}

async function prepareBookingEvent({ baseId, token, bookingId }) {
  const current = await resolveBookingEvidence({ baseId, token, bookingId });
  const fingerprint = bookingInputFingerprint(current.evidence);
  return {
    eventKind: 'booking',
    sourceRecordId: bookingId,
    fingerprint,
    impactedBookingIds: [bookingId],
  };
}

async function prepareShiftEvent({ baseId, token, shiftId }) {
  const shift = await readRecord({ baseId, token, table: TABLES.shifts, recordId: shiftId });
  assertTestEnvironment(shift, `Shift ${shiftId}`);
  const bookings = await listRecords({
    baseId,
    token,
    table: TABLES.bookings,
    fields: [FIELDS.booking.shiftLink, FIELDS.booking.environment],
  });
  const impactedBookingIds = findImpactedBookingIds({ bookings, shiftRecordId: shiftId });
  for (const bookingId of impactedBookingIds) {
    const booking = bookings.find((candidate) => candidate.id === bookingId);
    assertTestEnvironment(booking, `Impacted booking ${bookingId}`);
  }
  const shiftEvidence = computeShiftEvidence(shift);
  const fingerprint = shiftInputFingerprint({ shiftEvidence, impactedBookingIds });
  return {
    eventKind: 'shift',
    sourceRecordId: shiftId,
    fingerprint,
    impactedBookingIds,
  };
}

async function prepareEvent({ baseId, token, eventKind, sourceRecordId }) {
  if (eventKind === 'booking') {
    return prepareBookingEvent({ baseId, token, bookingId: sourceRecordId });
  }
  if (eventKind === 'shift') {
    return prepareShiftEvent({ baseId, token, shiftId: sourceRecordId });
  }
  throw new Error(`Unsupported --event-kind=${eventKind}; expected booking or shift.`);
}

async function executePreparedEvent({ baseId, token, prepared }) {
  if (prepared.eventKind === 'booking') {
    const evidence = await reconcileBooking({
      baseId,
      token,
      bookingId: prepared.sourceRecordId,
      invalidate: true,
    });
    return { impactedBookingIds: [prepared.sourceRecordId], bookingEvidence: [evidence] };
  }

  await invalidateBookings({ baseId, token, bookingIds: prepared.impactedBookingIds });
  const shiftEvidence = await reconcileShift({
    baseId,
    token,
    shiftId: prepared.sourceRecordId,
  });
  const bookingEvidence = [];
  for (const bookingId of prepared.impactedBookingIds) {
    bookingEvidence.push(
      await reconcileBooking({ baseId, token, bookingId, invalidate: false }),
    );
  }
  return { impactedBookingIds: prepared.impactedBookingIds, shiftEvidence, bookingEvidence };
}

async function runEvent({ baseId, token, eventKind, sourceRecordId, write }) {
  const prepared = await prepareEvent({ baseId, token, eventKind, sourceRecordId });
  const idempotencyKey = deterministicRunKey({
    eventKind,
    sourceRecordId,
    fingerprint: prepared.fingerprint,
  });
  const planned = { ...prepared, idempotencyKey, contractVersion: CONTRACT_VERSION, write };

  if (!write) {
    console.log(JSON.stringify({ mode: 'DRY_RUN', action: 'PLAN', ...planned }, null, 2));
    return { mode: 'DRY_RUN', action: 'PLAN', ...planned };
  }

  const { controlRecordId } = requiredWriteContext();
  const existing = await findUniqueRunByKey({ baseId, token, idempotencyKey });
  if (existing && ['Success', 'Running', 'Queued'].includes(existing.fields?.[FIELDS.run.status])) {
    const result = {
      mode: 'TEST_WRITE',
      action: 'NOOP',
      reason: `Existing deterministic run is ${existing.fields?.[FIELDS.run.status]}.`,
      existingRunId: existing.id,
      ...planned,
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  const startedAt = nowIso();
  let runRecord = existing;
  const attemptNumber = Number(existing?.fields?.[FIELDS.run.attemptNumber] || 0) + 1;
  const runningFields = {
    [FIELDS.run.name]: `P0.2-A.3E ${eventKind.toUpperCase()} ${sourceRecordId} ${startedAt}`,
    [FIELDS.run.controlLink]: [controlRecordId],
    [FIELDS.run.status]: 'Running',
    [FIELDS.run.environment]: 'Test',
    [FIELDS.run.triggerType]: 'Record Updated',
    [FIELDS.run.startedAt]: startedAt,
    [FIELDS.run.sourceRecordId]: sourceRecordId,
    [FIELDS.run.targetRecordId]: sourceRecordId,
    [FIELDS.run.resultMessage]: `Prepared ${eventKind} identity reconciliation; impacted=${prepared.impactedBookingIds.length}.`,
    [FIELDS.run.errorLog]: '',
    [FIELDS.run.runBy]: 'Santis OS Identity Evidence Reconciler',
    [FIELDS.run.idempotencyKey]: idempotencyKey,
    [FIELDS.run.inputFingerprint]: prepared.fingerprint,
    [FIELDS.run.namespace]: 'SHIFT_MATCH',
    [FIELDS.run.contractVersion]: CONTRACT_VERSION,
    [FIELDS.run.attemptNumber]: attemptNumber,
    [FIELDS.run.mutationType]: 'RECONCILE',
  };

  if (runRecord) {
    await patchRun({ baseId, token, runId: runRecord.id, fields: runningFields });
  } else {
    runRecord = await createRecord({ baseId, token, table: TABLES.runs, fields: runningFields });
  }

  try {
    const execution = await executePreparedEvent({ baseId, token, prepared });
    const finishedAt = nowIso();
    await patchRun({
      baseId,
      token,
      runId: runRecord.id,
      fields: {
        [FIELDS.run.status]: 'Success',
        [FIELDS.run.finishedAt]: finishedAt,
        [FIELDS.run.resultMessage]: `Reconciled ${eventKind}; impacted=${execution.impactedBookingIds.length}; fail-closed invalidation applied before booking cache refresh.`,
        [FIELDS.run.errorLog]: '',
        [FIELDS.run.mutationType]: 'RECONCILE',
      },
    });
    const result = {
      mode: 'TEST_WRITE',
      action: 'RECONCILED',
      runId: runRecord.id,
      finishedAt,
      ...planned,
      execution,
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    const finishedAt = nowIso();
    await patchRun({
      baseId,
      token,
      runId: runRecord.id,
      fields: {
        [FIELDS.run.status]: 'Failed',
        [FIELDS.run.finishedAt]: finishedAt,
        [FIELDS.run.resultMessage]: 'Identity reconciliation failed; any prior invalidation remains fail-closed.',
        [FIELDS.run.errorLog]: String(error?.message || error).slice(0, 5000),
      },
    }).catch(() => {});
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseId = firstEnv(BASE_ID_ENV_KEYS);
  const token = firstEnv(TOKEN_ENV_KEYS);
  const eventKind = String(args['event-kind'] || args.eventKind || '');
  const sourceRecordId = String(args['record-id'] || args.recordId || '');
  const write = args.write === true || args.write === 'true';

  if (!baseId) throw new Error('Missing Airtable base ID. Set AIRTABLE_BASE_ID or AIRTABLE_SANTIS_BASE_ID.');
  if (!token) throw new Error('Missing Airtable token. Set AIRTABLE_PAT or AIRTABLE_API_KEY.');
  if (!['booking', 'shift'].includes(eventKind)) {
    throw new Error('Missing or invalid --event-kind=booking|shift.');
  }
  if (!sourceRecordId.startsWith('rec')) {
    throw new Error('Missing or invalid --record-id=<rec...>.');
  }

  await runEvent({ baseId, token, eventKind, sourceRecordId, write });
}

main().catch((error) => {
  console.error(`❌ Identity evidence reconciler failed: ${error.message}`);
  process.exit(1);
});
