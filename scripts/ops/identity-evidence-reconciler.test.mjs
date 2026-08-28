import assert from 'node:assert/strict';
import test from 'node:test';

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
} from './identity-evidence-reconciler-core.mjs';

const IDS = {
  booking130: 'recg7dNoTiEhFW6u5',
  saban: 'recNnugIfgZGAUpSy',
  arzu: 'rec4UaeE7vHXWgJcV',
  arzuShift: 'recXYmwUBZQWrE0fH',
  booking175: 'recZXZxciP4rgZ6ik',
  therapist1: 'recjcknHE0T70Ldm0',
  therapist2: 'recFQE7i08tUxhCEt',
  shift1: 'recM6KGAwAje9Nopj',
  shift2: 'rec8aN10qoIRIBKhD',
};

function shift({ id, staffId, signature, environment = 'Test' }) {
  return {
    id,
    fields: {
      Environment: environment,
      Staff_Link: staffId ? [staffId] : [],
      Shift_Identity_Source_Signature_v0_1: signature,
    },
  };
}

function booking({ id, therapistId, shiftId, signature, environment = 'Test' }) {
  return {
    id,
    fields: {
      Environment: environment,
      Therapist_Link: therapistId ? [therapistId] : [],
      'Staff Shift Link': shiftId ? [shiftId] : [],
      Identity_Source_Signature_v0_1: signature,
    },
  };
}

test('#130 fixture resolves exact stable-ID mismatch evidence', () => {
  const arzuShift = shift({
    id: IDS.arzuShift,
    staffId: IDS.arzu,
    signature: 'SHIFT=BUD-2026-06-21-ARZU||STAFF=ARZU',
  });
  const booking130 = booking({
    id: IDS.booking130,
    therapistId: IDS.saban,
    shiftId: IDS.arzuShift,
    signature: 'BT=recNnugIfgZGAUpSy||BTCOUNT=1||SHIFT=BUD-2026-06-21-ARZU',
  });

  const evidence = computeBookingEvidence({
    bookingRecord: booking130,
    shiftsById: new Map([[arzuShift.id, arzuShift]]),
  });

  assert.equal(evidence.therapistCount, 1);
  assert.equal(evidence.shiftLinkCount, 1);
  assert.deepEqual(evidence.therapistIds, [IDS.saban]);
  assert.deepEqual(evidence.linkedShiftStaffIds, [IDS.arzu]);
  assert.notEqual(evidence.therapistIds[0], evidence.linkedShiftSingleStaffRecordId);
  assert.equal(bookingCachePatch(evidence).Linked_Shift_Staff_Record_ID, IDS.arzu);
});

test('#175 matching fixture produces one-to-one exact evidence', () => {
  const shift1 = shift({
    id: IDS.shift1,
    staffId: IDS.therapist1,
    signature: 'SHIFT=QA1||STAFF=T1',
  });
  const booking175 = booking({
    id: IDS.booking175,
    therapistId: IDS.therapist1,
    shiftId: IDS.shift1,
    signature: 'BT=T1||BTCOUNT=1||SHIFT=QA1',
  });
  const evidence = computeBookingEvidence({
    bookingRecord: booking175,
    shiftsById: new Map([[shift1.id, shift1]]),
  });

  assert.equal(evidence.therapistIds[0], IDS.therapist1);
  assert.equal(evidence.linkedShiftSingleStaffRecordId, IDS.therapist1);
  assert.equal(evidence.shiftLinkCount, 1);
});

test('booking mutation changes fingerprint and deterministic run key', () => {
  const shift1 = shift({ id: IDS.shift1, staffId: IDS.therapist1, signature: 'S1' });
  const shift2 = shift({ id: IDS.shift2, staffId: IDS.therapist2, signature: 'S2' });
  const original = booking({
    id: IDS.booking175,
    therapistId: IDS.therapist1,
    shiftId: IDS.shift1,
    signature: 'BT=T1||SHIFT=S1',
  });
  const mutated = booking({
    id: IDS.booking175,
    therapistId: IDS.therapist1,
    shiftId: IDS.shift2,
    signature: 'BT=T1||SHIFT=S2',
  });

  const originalEvidence = computeBookingEvidence({
    bookingRecord: original,
    shiftsById: new Map([[shift1.id, shift1]]),
  });
  const mutatedEvidence = computeBookingEvidence({
    bookingRecord: mutated,
    shiftsById: new Map([[shift2.id, shift2]]),
  });
  const originalFingerprint = bookingInputFingerprint(originalEvidence);
  const mutatedFingerprint = bookingInputFingerprint(mutatedEvidence);

  assert.notEqual(originalFingerprint, mutatedFingerprint);
  assert.notEqual(
    deterministicRunKey({ eventKind: 'booking', sourceRecordId: IDS.booking175, fingerprint: originalFingerprint }),
    deterministicRunKey({ eventKind: 'booking', sourceRecordId: IDS.booking175, fingerprint: mutatedFingerprint }),
  );
});

test('same input produces same deterministic key for duplicate-run NOOP', () => {
  const shift1 = shift({ id: IDS.shift1, staffId: IDS.therapist1, signature: 'S1' });
  const booking175 = booking({
    id: IDS.booking175,
    therapistId: IDS.therapist1,
    shiftId: IDS.shift1,
    signature: 'BT=T1||SHIFT=S1',
  });
  const evidence = computeBookingEvidence({
    bookingRecord: booking175,
    shiftsById: new Map([[shift1.id, shift1]]),
  });
  const fingerprintA = bookingInputFingerprint(evidence);
  const fingerprintB = bookingInputFingerprint(evidence);
  const keyA = deterministicRunKey({ eventKind: 'booking', sourceRecordId: IDS.booking175, fingerprint: fingerprintA });
  const keyB = deterministicRunKey({ eventKind: 'booking', sourceRecordId: IDS.booking175, fingerprint: fingerprintB });

  assert.equal(keyA, keyB);
  assert.match(keyA, new RegExp(`^${CONTRACT_VERSION.replaceAll('.', '\\.')}`));
});

test('shift-owner mutation changes shift event fingerprint', () => {
  const before = computeShiftEvidence(
    shift({ id: IDS.shift2, staffId: IDS.therapist2, signature: 'SHIFT=QA2||STAFF=T2' }),
  );
  const after = computeShiftEvidence(
    shift({ id: IDS.shift2, staffId: IDS.therapist1, signature: 'SHIFT=QA2||STAFF=T1' }),
  );
  const impacted = [IDS.booking175];

  assert.notEqual(
    shiftInputFingerprint({ shiftEvidence: before, impactedBookingIds: impacted }),
    shiftInputFingerprint({ shiftEvidence: after, impactedBookingIds: impacted }),
  );
});

test('cross-record propagation discovers impacted bookings by exact linked record ID', () => {
  const bookings = [
    booking({ id: IDS.booking175, therapistId: IDS.therapist1, shiftId: IDS.shift1, signature: 'A' }),
    booking({ id: IDS.booking130, therapistId: IDS.saban, shiftId: IDS.arzuShift, signature: 'B' }),
    {
      id: 'recAAAAAAAAAAAAAA',
      fields: {
        Environment: 'Test',
        'Staff Shift Link': [{ id: IDS.shift1, name: 'Misleading duplicate display label' }],
      },
    },
  ];

  assert.deepEqual(findImpactedBookingIds({ bookings, shiftRecordId: IDS.shift1 }), [
    'recAAAAAAAAAAAAAA',
    IDS.booking175,
  ].sort());
  assert.deepEqual(findImpactedBookingIds({ bookings, shiftRecordId: IDS.arzuShift }), [IDS.booking130]);
});

test('invalid shift staff cardinality fails evidence scalarization closed', () => {
  const multiStaffShift = {
    id: IDS.shift2,
    fields: {
      Environment: 'Test',
      Staff_Link: [IDS.therapist1, IDS.therapist2],
      Shift_Identity_Source_Signature_v0_1: 'MULTI',
    },
  };
  const evidence = computeShiftEvidence(multiStaffShift);
  const patch = shiftCachePatch(evidence);

  assert.equal(evidence.staffCount, 2);
  assert.equal(evidence.singleStaffRecordId, null);
  assert.equal(patch.Shift_Staff_Record_ID, null);
  assert.equal(patch.Shift_Staff_Count, 2);
});

test('write contract rejects Live records', () => {
  assert.throws(
    () => assertTestEnvironment({ id: IDS.booking130, fields: { Environment: 'Live' } }, 'Booking #130'),
    /Test-only/,
  );
  assert.doesNotThrow(() =>
    assertTestEnvironment({ id: IDS.booking175, fields: { Environment: 'Test' } }, 'Booking #175'),
  );
});
