import { createHash } from 'node:crypto';

export interface AirtableStagingAcceptanceConfig {
  baseId: string;
  tableId: string;
  token: string;
  baseSha256: string;
  timeoutMs: number;
  acceptanceEvidencePath: string;
}

export interface StagingPreflightEvidence {
  explicitExecutionGate: true;
  productionEnvironmentRejected: true;
  productionBaseRejected: true;
  genericAirtableCredentialsRejected: true;
  stagingBaseAllowlisted: true;
  credentialPresent: true;
  credentialLogged: false;
  baseFingerprint: string;
  tableFingerprint: string;
}

const REQUIRED_EXECUTION_GATE = 'REAL_AIRTABLE_STAGING_ACCEPTANCE';
const REQUIRED_ENVIRONMENT = 'staging';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function required(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`STAGING_PREFLIGHT_MISSING:${name}`);
  return normalized;
}

function rejectGenericAirtableFallbacks(env: NodeJS.ProcessEnv): void {
  const forbidden = [
    'AIRTABLE_API_KEY',
    'AIRTABLE_TOKEN',
    'AIRTABLE_BASE_ID',
    'AIRTABLE_TABLE_ID',
  ];

  for (const name of forbidden) {
    if (env[name]?.trim()) {
      throw new Error(`STAGING_PREFLIGHT_GENERIC_AIRTABLE_ENV_FORBIDDEN:${name}`);
    }
  }
}

export function loadAndValidateStagingConfig(
  env: NodeJS.ProcessEnv = process.env,
): { config: AirtableStagingAcceptanceConfig; evidence: StagingPreflightEvidence } {
  if (env.SANTIS_STAGING_ACCEPTANCE_GATE !== REQUIRED_EXECUTION_GATE) {
    throw new Error('STAGING_PREFLIGHT_EXPLICIT_GATE_REQUIRED');
  }

  if (env.NODE_ENV === 'production' || env.SANTIS_ENVIRONMENT === 'production') {
    throw new Error('STAGING_PREFLIGHT_PRODUCTION_ENVIRONMENT_FORBIDDEN');
  }

  if (env.SANTIS_ENVIRONMENT !== REQUIRED_ENVIRONMENT) {
    throw new Error('STAGING_PREFLIGHT_ENVIRONMENT_MUST_BE_STAGING');
  }

  rejectGenericAirtableFallbacks(env);

  const baseId = required('AIRTABLE_STAGING_BASE_ID', env.AIRTABLE_STAGING_BASE_ID);
  const tableId = required('AIRTABLE_STAGING_TABLE_ID', env.AIRTABLE_STAGING_TABLE_ID);
  const token = required('AIRTABLE_STAGING_TOKEN', env.AIRTABLE_STAGING_TOKEN);
  const allowedBaseSha256 = required(
    'AIRTABLE_STAGING_BASE_SHA256_ALLOWLIST',
    env.AIRTABLE_STAGING_BASE_SHA256_ALLOWLIST,
  ).toLowerCase();
  const forbiddenBaseSha256 = required(
    'AIRTABLE_FORBIDDEN_BASE_SHA256',
    env.AIRTABLE_FORBIDDEN_BASE_SHA256,
  )
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!/^app[a-zA-Z0-9]+$/.test(baseId)) {
    throw new Error('STAGING_PREFLIGHT_BASE_ID_INVALID');
  }
  if (!/^tbl[a-zA-Z0-9]+$/.test(tableId)) {
    throw new Error('STAGING_PREFLIGHT_TABLE_ID_INVALID');
  }
  if (!/^[a-f0-9]{64}$/.test(allowedBaseSha256)) {
    throw new Error('STAGING_PREFLIGHT_BASE_ALLOWLIST_HASH_INVALID');
  }
  if (
    forbiddenBaseSha256.length === 0 ||
    forbiddenBaseSha256.some((hash) => !/^[a-f0-9]{64}$/.test(hash))
  ) {
    throw new Error('STAGING_PREFLIGHT_FORBIDDEN_BASE_HASH_INVALID');
  }

  const actualBaseSha256 = sha256(baseId);
  if (actualBaseSha256 !== allowedBaseSha256) {
    throw new Error('STAGING_PREFLIGHT_BASE_NOT_ALLOWLISTED');
  }
  if (forbiddenBaseSha256.includes(actualBaseSha256)) {
    throw new Error('STAGING_PREFLIGHT_BASE_EXPLICITLY_FORBIDDEN');
  }
  if (forbiddenBaseSha256.includes(allowedBaseSha256)) {
    throw new Error('STAGING_PREFLIGHT_ALLOWLIST_FORBIDDEN_OVERLAP');
  }

  const timeoutRaw = env.AIRTABLE_STAGING_TIMEOUT_MS?.trim() || '8000';
  const timeoutMs = Number(timeoutRaw);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 500 || timeoutMs > 30_000) {
    throw new Error('STAGING_PREFLIGHT_TIMEOUT_OUT_OF_RANGE');
  }

  const acceptanceEvidencePath =
    env.STAGING_ACCEPTANCE_EVIDENCE_PATH?.trim() ||
    'packages/database/acceptance-evidence.json';

  return {
    config: {
      baseId,
      tableId,
      token,
      baseSha256: actualBaseSha256,
      timeoutMs,
      acceptanceEvidencePath,
    },
    evidence: {
      explicitExecutionGate: true,
      productionEnvironmentRejected: true,
      productionBaseRejected: true,
      genericAirtableCredentialsRejected: true,
      stagingBaseAllowlisted: true,
      credentialPresent: true,
      credentialLogged: false,
      baseFingerprint: `sha256:${actualBaseSha256}`,
      tableFingerprint: `sha256:${sha256(tableId)}`,
    },
  };
}
