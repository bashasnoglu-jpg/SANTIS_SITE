import crypto from 'node:crypto';

export const CONTRACT_VERSION = 'IDENTITY-RECON-0.2.0';

export function normalizeRecordIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : item?.id))
    .filter((item) => typeof item === 'string' && item.startsWith('rec'));
}

export function stableRecordIds(value) {
  return [...new Set(normalizeRecordIds(value))].sort();
}

export function sha256(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

export function canonicalInputFingerprint(payload) {
  const normalized = JSON.stringify(payload, Object.keys(payload).sort());
  return `sha256:${sha256(normalized)}`;
}

export function deterministicRunKey({ eventKind, sourceRecordId, fingerprint }) {
  if (!['booking', 'shift'].includes(eventKind)) {
    throw new Error(`Unsupported eventKind: ${eventKind}`);
  }
  if (!String(sourceRecordId || '').startsWith('rec')) {
    throw new Error('sourceRecordId must be an Airtable record ID.');
  }
  return `${CONTRACT_VERSION}|${eventKind.toUpperCase()}|SRC=${sourceRecordId}|H=${fingerprint.replace(/^sha256:/, '')}`;
}

export function computeShiftEvidence(shiftRecord) {
  if (!shiftRecord?.id || !String(shiftRecord.id).startsWith('rec')) {
    throw new Error('Shift record must include a valid Airtable record ID.');
  }
  const fields = shiftRecord.fields || {};
  const staffIds = stableRecordIds(fields.Staff_Link);
  const sourceSignature = String(fields.Shift_Identity_Source_Signature_v0_1 || '').trim();

  return {
    shiftRecordId: shiftRecord.id,
    staffIds,
    staffCount: staffIds.length,
    singleStaffRecordId: staffIds.length === 1 ? staffIds[0] : null,
    sourceSignature,
  };
}

export function computeBookingEvidence({ bookingRecord, shiftsById }) {
  if (!bookingRecord?.id || !String(bookingRecord.id).startsWith('rec')) {
    throw new Error('Booking record must include a valid Airtable record ID.');
  }

  const fields = bookingRecord.fields || {};
  const therapistIds = stableRecordIds(fields.Therapist_Link);
  const shiftIds = stableRecordIds(fields['Staff Shift Link']);
  const sourceSignature = String(fields.Identity_Source_Signature_v0_1 || '').trim();

  let linkedShiftStaffIds = [];
  if (shiftIds.length === 1) {
    const shift = shiftsById.get(shiftIds[0]);
    if (!shift) throw new Error(`Linked shift was not resolved: ${shiftIds[0]}`);
    linkedShiftStaffIds = stableRecordIds(shift.fields?.Staff_Link);
  }

  return {
    bookingRecordId: bookingRecord.id,
    therapistIds,
    therapistCount: therapistIds.length,
    shiftIds,
    shiftLinkCount: shiftIds.length,
    linkedShiftStaffIds,
    linkedShiftStaffCount: linkedShiftStaffIds.length,
    linkedShiftSingleStaffRecordId:
      shiftIds.length === 1 && linkedShiftStaffIds.length === 1 ? linkedShiftStaffIds[0] : null,
    sourceSignature,
  };
}

export function bookingInputFingerprint(evidence) {
  return canonicalInputFingerprint({
    bookingRecordId: evidence.bookingRecordId,
    therapistIds: [...evidence.therapistIds],
    therapistCount: evidence.therapistCount,
    shiftIds: [...evidence.shiftIds],
    shiftLinkCount: evidence.shiftLinkCount,
    linkedShiftStaffIds: [...evidence.linkedShiftStaffIds],
    linkedShiftStaffCount: evidence.linkedShiftStaffCount,
    sourceSignature: evidence.sourceSignature,
  });
}

export function shiftInputFingerprint({ shiftEvidence, impactedBookingIds = [] }) {
  return canonicalInputFingerprint({
    shiftRecordId: shiftEvidence.shiftRecordId,
    staffIds: [...shiftEvidence.staffIds],
    staffCount: shiftEvidence.staffCount,
    sourceSignature: shiftEvidence.sourceSignature,
    impactedBookingIds: [...new Set(impactedBookingIds)].sort(),
  });
}

export function bookingCachePatch(evidence) {
  if (!evidence.sourceSignature) {
    throw new Error('Booking source signature is missing; reconciliation must fail closed.');
  }
  return {
    Linked_Shift_Staff_Record_ID: evidence.linkedShiftSingleStaffRecordId,
    Staff_Shift_Link_Count: evidence.shiftLinkCount,
    Identity_Reconciled_Source_Signature_v0_1: evidence.sourceSignature,
  };
}

export function shiftCachePatch(evidence) {
  if (!evidence.sourceSignature) {
    throw new Error('Shift source signature is missing; reconciliation must fail closed.');
  }
  return {
    Shift_Staff_Record_ID: evidence.singleStaffRecordId,
    Shift_Staff_Count: evidence.staffCount,
    Shift_Identity_Reconciled_Source_Signature_v0_1: evidence.sourceSignature,
  };
}

export function findImpactedBookingIds({ bookings, shiftRecordId }) {
  if (!String(shiftRecordId || '').startsWith('rec')) {
    throw new Error('shiftRecordId must be an Airtable record ID.');
  }
  return (bookings || [])
    .filter((booking) => stableRecordIds(booking.fields?.['Staff Shift Link']).includes(shiftRecordId))
    .map((booking) => booking.id)
    .filter((id) => typeof id === 'string' && id.startsWith('rec'))
    .sort();
}

export function assertTestEnvironment(record, label) {
  const environment = record?.fields?.Environment;
  if (environment !== 'Test') {
    throw new Error(`${label} write mode is Test-only; Environment=${JSON.stringify(environment)}.`);
  }
}
