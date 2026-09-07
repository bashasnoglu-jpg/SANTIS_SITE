import assert from 'node:assert/strict';
import test from 'node:test';

import { CanonicalStateHasher } from '../canonical-serializer.js';
import {
  BOOKING_ATTEMPT_CONTRACT_VERSION,
  CANONICAL_REQUEST_TYPE,
  type CanonicalAuthorityState,
} from '../contracts.js';

const validState: CanonicalAuthorityState = {
  requestExactId: 'recReq123',
  requestType: CANONICAL_REQUEST_TYPE,
  contractVersion: BOOKING_ATTEMPT_CONTRACT_VERSION,
  policyVersion: 'R1.4-POLICY-1.0',
  gateVersion: 'R2-PHASE4-MASTER-1.0',
  tenantExactId: 'recTen123',
  locationExactId: 'recLoc123',
  clientExactId: 'recCli123',
  serviceExactId: 'recSrv123',
  therapistExactId: 'recTh123',
  roomExactId: 'recRoom123',
  shiftExactId: 'recShift123',
  requestEnv: 'Live',
  tenantEnv: 'Live',
  locationEnv: 'Live',
  clientEnv: 'Live',
  serviceEnv: 'Live',
  therapistEnv: 'Live',
  roomEnv: 'Live',
  shiftEnv: 'Live',
  locationParentTenantExactId: 'recTen123',
  therapistServiceAuthorityRecordId: 'recThAuth1',
  roomServiceAuthorityRecordId: 'recRmAuth1',
  quarantineStates: [
    'TENANT:CLEAR',
    'LOCATION:CLEAR',
    'CLIENT:CLEAR',
    'ROOM:CLEAR',
    'THERAPIST:CLEAR',
    'SHIFT:CLEAR',
    'SERVICE:CLEAR',
  ],
  operationalEligibilityStates: [
    'THERAPIST:ELIGIBLE',
    'ROOM:ELIGIBLE',
    'SERVICE:ELIGIBLE',
    'SHIFT:ELIGIBLE',
    'CLIENT:ELIGIBLE',
  ],
  priceMinorUnits: 8000,
  currencyIsoCode: 'eur',
  durationMinutes: 50,
};

test('R1.4 canonical hash is deterministic and normalizes ISO currency case', () => {
  const lowerCaseHash = CanonicalStateHasher.computeSHA256(validState);
  const upperCaseHash = CanonicalStateHasher.computeSHA256({
    ...validState,
    currencyIsoCode: 'EUR',
  });

  assert.equal(lowerCaseHash, upperCaseHash);
  assert.match(lowerCaseHash, /^[a-f0-9]{64}$/);
  assert.match(CanonicalStateHasher.serialize(validState), /"currencyIsoCode":"EUR"/);
});

test('R1.4 rejects floating-point, negative, or invalid duration economics', () => {
  assert.throws(
    () => CanonicalStateHasher.computeSHA256({ ...validState, priceMinorUnits: 80.5 }),
    /DEPENDENCY_NOT_PROVEN/,
  );
  assert.throws(
    () => CanonicalStateHasher.computeSHA256({ ...validState, priceMinorUnits: -1 }),
    /DEPENDENCY_NOT_PROVEN/,
  );
  assert.throws(
    () => CanonicalStateHasher.computeSHA256({ ...validState, durationMinutes: 0 }),
    /DEPENDENCY_NOT_PROVEN/,
  );
});

test('R1.4 rejects blank required dependencies', () => {
  assert.throws(
    () => CanonicalStateHasher.computeSHA256({ ...validState, roomExactId: '  ' }),
    /DEPENDENCY_NOT_PROVEN/,
  );
});

test('R1.4 tamper detection: changing price changes the authority hash', () => {
  const originalHash = CanonicalStateHasher.computeSHA256(validState);
  const tamperedHash = CanonicalStateHasher.computeSHA256({
    ...validState,
    priceMinorUnits: 9000,
  });

  assert.notEqual(originalHash, tamperedHash);
});

test('R1.4 serializer is resistant to top-level key-order drift', () => {
  const outOfOrderState = {} as CanonicalAuthorityState;
  const keys = Object.keys(validState).reverse() as (keyof CanonicalAuthorityState)[];

  for (const key of keys) {
    (outOfOrderState as unknown as Record<string, unknown>)[key] = validState[key];
  }

  assert.equal(
    CanonicalStateHasher.serialize(validState),
    CanonicalStateHasher.serialize(outOfOrderState),
  );
});

test('R1.4 unordered evidence sets are canonically sorted', () => {
  const hashA = CanonicalStateHasher.computeSHA256({
    ...validState,
    quarantineStates: ['A', 'B'],
    operationalEligibilityStates: ['X', 'Y'],
  });
  const hashB = CanonicalStateHasher.computeSHA256({
    ...validState,
    quarantineStates: ['B', 'A'],
    operationalEligibilityStates: ['Y', 'X'],
  });

  assert.equal(hashA, hashB);
});

test('R1.4 fails closed on unknown fields instead of silently hashing schema drift', () => {
  const drifted = {
    ...validState,
    surpriseAuthorityField: 'SHOULD_NOT_EXIST',
  } as CanonicalAuthorityState;

  assert.throws(
    () => CanonicalStateHasher.computeSHA256(drifted),
    /unknown authority state field/,
  );
});

test('R1.4 rejects blank or duplicate members in unordered evidence sets', () => {
  assert.throws(
    () =>
      CanonicalStateHasher.computeSHA256({
        ...validState,
        quarantineStates: ['TENANT:CLEAR', ''],
      }),
    /DEPENDENCY_NOT_PROVEN/,
  );

  assert.throws(
    () =>
      CanonicalStateHasher.computeSHA256({
        ...validState,
        operationalEligibilityStates: ['ROOM:ELIGIBLE', 'ROOM:ELIGIBLE'],
      }),
    /DEPENDENCY_NOT_PROVEN/,
  );
});

test('R1.4 optional reception-staff context must be present as an exact pair', () => {
  assert.throws(
    () =>
      CanonicalStateHasher.computeSHA256({
        ...validState,
        recStaffExactId: 'recStaff123',
      }),
    /recStaffExactId and recStaffEnv must be present or absent together/,
  );

  const paired = CanonicalStateHasher.computeSHA256({
    ...validState,
    recStaffExactId: 'recStaff123',
    recStaffEnv: 'Live',
  });
  assert.match(paired, /^[a-f0-9]{64}$/);
});
