import { createHash } from 'node:crypto';

import {
  BOOKING_ATTEMPT_CONTRACT_VERSION,
  CANONICAL_REQUEST_TYPE,
  type CanonicalAuthorityState,
  type CanonicalEnvironment,
} from './contracts.js';

const REQUIRED_KEYS = [
  'requestExactId',
  'requestType',
  'contractVersion',
  'policyVersion',
  'gateVersion',
  'tenantExactId',
  'locationExactId',
  'clientExactId',
  'serviceExactId',
  'therapistExactId',
  'roomExactId',
  'shiftExactId',
  'requestEnv',
  'tenantEnv',
  'locationEnv',
  'clientEnv',
  'serviceEnv',
  'therapistEnv',
  'roomEnv',
  'shiftEnv',
  'locationParentTenantExactId',
  'therapistServiceAuthorityRecordId',
  'roomServiceAuthorityRecordId',
  'quarantineStates',
  'operationalEligibilityStates',
  'priceMinorUnits',
  'currencyIsoCode',
  'durationMinutes',
] as const satisfies readonly (keyof CanonicalAuthorityState)[];

const OPTIONAL_KEYS = [
  'recStaffExactId',
  'recStaffEnv',
] as const satisfies readonly (keyof CanonicalAuthorityState)[];

const EXACT_ID_KEYS = [
  'requestExactId',
  'tenantExactId',
  'locationExactId',
  'clientExactId',
  'serviceExactId',
  'therapistExactId',
  'roomExactId',
  'shiftExactId',
  'locationParentTenantExactId',
  'therapistServiceAuthorityRecordId',
  'roomServiceAuthorityRecordId',
  'recStaffExactId',
] as const satisfies readonly (keyof CanonicalAuthorityState)[];

const ENV_KEYS = [
  'requestEnv',
  'tenantEnv',
  'locationEnv',
  'clientEnv',
  'serviceEnv',
  'therapistEnv',
  'roomEnv',
  'shiftEnv',
  'recStaffEnv',
] as const satisfies readonly (keyof CanonicalAuthorityState)[];

const CANONICAL_ENVIRONMENTS = new Set<CanonicalEnvironment>([
  'Live',
  'Test',
  'Archive',
]);

function dependencyNotProven(message: string): never {
  throw new Error(`DEPENDENCY_NOT_PROVEN: ${message}`);
}

function assertNonBlankString(value: unknown, key: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    dependencyNotProven(`${key} must be a non-empty canonical string without outer whitespace`);
  }
}

function assertExactRecordId(value: unknown, key: string): void {
  assertNonBlankString(value, key);
  if (!/^rec[A-Za-z0-9]+$/.test(value)) {
    dependencyNotProven(`${key} must be an exact Airtable record id`);
  }
}

function assertEnvironment(value: unknown, key: string): void {
  assertNonBlankString(value, key);
  if (!CANONICAL_ENVIRONMENTS.has(value as CanonicalEnvironment)) {
    dependencyNotProven(`${key} must be exactly Live, Test, or Archive`);
  }
}

function normalizeCanonicalSet(value: unknown, key: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    dependencyNotProven(`${key} must be a non-empty array`);
  }

  const normalized = value.map((item, index) => {
    assertNonBlankString(item, `${key}[${index}]`);
    return item;
  });

  if (new Set(normalized).size !== normalized.length) {
    dependencyNotProven(`${key} must not contain duplicate set members`);
  }

  return [...normalized].sort();
}

function validateState(state: CanonicalAuthorityState): void {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    dependencyNotProven('authority state must be an object');
  }

  const raw = state as unknown as Record<string, unknown>;
  const allowedKeys = new Set<string>([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      dependencyNotProven(`unknown authority state field -> ${key}`);
    }
  }

  for (const key of REQUIRED_KEYS) {
    const value = raw[key];
    if (value === undefined || value === null) {
      dependencyNotProven(`missing required state field -> ${key}`);
    }
    if (typeof value === 'string' && (value.length === 0 || value.trim() !== value)) {
      dependencyNotProven(`invalid required state field -> ${key}`);
    }
  }

  if (state.requestType !== CANONICAL_REQUEST_TYPE) {
    dependencyNotProven(`requestType must be ${CANONICAL_REQUEST_TYPE}`);
  }

  if (state.contractVersion !== BOOKING_ATTEMPT_CONTRACT_VERSION) {
    dependencyNotProven(`contractVersion must be ${BOOKING_ATTEMPT_CONTRACT_VERSION}`);
  }

  assertNonBlankString(state.policyVersion, 'policyVersion');
  assertNonBlankString(state.gateVersion, 'gateVersion');

  for (const key of EXACT_ID_KEYS) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    assertExactRecordId(value, key);
  }

  for (const key of ENV_KEYS) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    assertEnvironment(value, key);
  }

  const recStaffIdPresent = state.recStaffExactId !== undefined && state.recStaffExactId !== null;
  const recStaffEnvPresent = state.recStaffEnv !== undefined && state.recStaffEnv !== null;
  if (recStaffIdPresent !== recStaffEnvPresent) {
    dependencyNotProven('recStaffExactId and recStaffEnv must be present or absent together');
  }

  if (!Number.isSafeInteger(state.priceMinorUnits) || state.priceMinorUnits < 0) {
    dependencyNotProven('priceMinorUnits must be a non-negative safe integer');
  }

  if (!Number.isSafeInteger(state.durationMinutes) || state.durationMinutes <= 0) {
    dependencyNotProven('durationMinutes must be a positive safe integer');
  }

  if (!/^[A-Za-z]{3}$/.test(state.currencyIsoCode)) {
    dependencyNotProven('currencyIsoCode must be a 3-letter ISO code');
  }

  normalizeCanonicalSet(state.quarantineStates, 'quarantineStates');
  normalizeCanonicalSet(state.operationalEligibilityStates, 'operationalEligibilityStates');
}

export class CanonicalStateHasher {
  /**
   * Deterministically serializes the complete R1.4 authority state.
   * Required values are fail-closed; optional reception-staff context is emitted as
   * explicit null when absent so equivalent states have one byte representation.
   */
  static serialize(state: CanonicalAuthorityState): string {
    validateState(state);

    const raw = state as unknown as Record<string, unknown>;
    const normalized: Record<string, unknown> = {
      recStaffEnv: state.recStaffEnv ?? null,
      recStaffExactId: state.recStaffExactId ?? null,
    };

    for (const key of REQUIRED_KEYS) {
      const value = raw[key];
      if (key === 'currencyIsoCode') {
        normalized[key] = state.currencyIsoCode.toUpperCase();
      } else if (key === 'quarantineStates') {
        normalized[key] = normalizeCanonicalSet(value, key);
      } else if (key === 'operationalEligibilityStates') {
        normalized[key] = normalizeCanonicalSet(value, key);
      } else {
        normalized[key] = value;
      }
    }

    const ordered: Record<string, unknown> = {};
    for (const key of Object.keys(normalized).sort()) {
      ordered[key] = normalized[key];
    }

    return JSON.stringify(ordered);
  }

  static hashSerialized(serializedState: string): string {
    if (typeof serializedState !== 'string' || serializedState.length === 0) {
      dependencyNotProven('serialized authority state must be non-empty');
    }
    return createHash('sha256').update(serializedState, 'utf8').digest('hex');
  }

  static computeSHA256(state: CanonicalAuthorityState): string {
    return this.hashSerialized(this.serialize(state));
  }
}
