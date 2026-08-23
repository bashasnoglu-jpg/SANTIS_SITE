import { randomUUID, createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

import {
  BOOKING_ATTEMPT_CONTRACT_VERSION,
  type ProjectionEnvelope,
} from '../src/booking-attempt/contracts.js';
import {
  EvidenceIntegrityConflict,
  generateProjectionFingerprint,
} from '../src/booking-attempt/mock-airtable-evidence-adapter.js';
import {
  BookingAttemptOutboxWorker,
  type BookingAttemptOutboxItem,
  type BookingAttemptOutboxStore,
} from '../src/booking-attempt/outbox-worker.js';
import { RealAirtableStagingAdapter } from './real-airtable-staging-adapter.js';
import { loadAndValidateStagingConfig } from './staging-preflight-guard.js';

interface MutableAcceptanceOutbox {
  item: BookingAttemptOutboxItem | null;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  retryCount: number;
  processedAt: Date | null;
  nextAttemptAt: Date | null;
  lastErrorCode: string | null;
}

class AcceptanceOutboxStore implements BookingAttemptOutboxStore {
  constructor(readonly state: MutableAcceptanceOutbox) {}

  async claimNext(now: Date, _leaseUntil: Date): Promise<BookingAttemptOutboxItem | null> {
    if (!this.state.item) return null;
    if (this.state.status === 'SUCCESS') return null;
    if (
      this.state.status === 'FAILED' &&
      (!this.state.nextAttemptAt || this.state.nextAttemptAt.getTime() > now.getTime())
    ) {
      return null;
    }
    this.state.status = 'PROCESSING';
    return { ...this.state.item, retryCount: this.state.retryCount };
  }

  async markSuccess(_outboxId: string, processedAt: Date): Promise<void> {
    this.state.status = 'SUCCESS';
    this.state.processedAt = processedAt;
    this.state.nextAttemptAt = null;
    this.state.lastErrorCode = null;
  }

  async markFailure(
    _outboxId: string,
    errorCode: string,
    nextAttemptAt: Date,
  ): Promise<void> {
    this.state.status = 'FAILED';
    this.state.retryCount += 1;
    this.state.processedAt = null;
    this.state.nextAttemptAt = nextAttemptAt;
    this.state.lastErrorCode = errorCode;
  }

  async markTerminalFailure(_outboxId: string, errorCode: string): Promise<void> {
    this.state.status = 'FAILED';
    this.state.processedAt = null;
    this.state.nextAttemptAt = null;
    this.state.lastErrorCode = errorCode;
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function makeEnvelope(runId: string): ProjectionEnvelope {
  const attemptId = randomUUID();
  const bookingId = randomUUID();
  const claimedAt = new Date().toISOString();
  const finalizedAt = new Date(Date.now() + 1).toISOString();

  return {
    contractVersion: BOOKING_ATTEMPT_CONTRACT_VERSION,
    attemptId,
    requestId: `staging-request-${runId}`,
    idempotencyKey: `staging-idempotency-${runId}`,
    requestFingerprint: `sha256:${sha256(`request:${runId}`)}`,
    postgresClaimId: randomUUID(),
    writerCommitSha: process.env.STAGING_EXPECTED_HEAD_SHA?.trim() || 'UNBOUND_HEAD',
    runtimeTraceId: `staging-trace-${runId}`,
    outcome: 'SUCCESS',
    canonicalBookingId: bookingId,
    claimedAt,
    finalizedAt,
  };
}

async function main(): Promise<void> {
  const { config, evidence: preflight } = loadAndValidateStagingConfig();
  const expectedHead = process.env.STAGING_EXPECTED_HEAD_SHA?.trim();
  if (!expectedHead || !/^[a-f0-9]{40}$/.test(expectedHead)) {
    throw new Error('STAGING_ACCEPTANCE_EXPECTED_HEAD_SHA_REQUIRED');
  }

  const acceptanceRunId = randomUUID();
  const adapter = new RealAirtableStagingAdapter({
    baseId: config.baseId,
    tableId: config.tableId,
    token: config.token,
    timeoutMs: config.timeoutMs,
    acceptanceRunId,
    faultMode: 'NONE',
  });

  const envelope = makeEnvelope(acceptanceRunId);
  const fingerprint = generateProjectionFingerprint(envelope);

  const ruleAReceipt = await adapter.deliverWithReceipt(envelope);
  const afterRuleA = await adapter.findByAttemptId(envelope.attemptId);
  if (afterRuleA.length !== 1) throw new Error('STAGING_RULE_A_CARDINALITY_FAILED');

  const beforeReplayRecordId = afterRuleA[0]!.id;
  const beforeReplayFingerprint = afterRuleA[0]!.fields.projection_fingerprint;
  const ruleBReceipt = await adapter.deliverWithReceipt(envelope);
  const afterRuleB = await adapter.findByAttemptId(envelope.attemptId);
  if (afterRuleB.length !== 1) throw new Error('STAGING_RULE_B_CARDINALITY_FAILED');
  if (afterRuleB[0]!.id !== beforeReplayRecordId) {
    throw new Error('STAGING_RULE_B_CREATED_DUPLICATE');
  }
  if (afterRuleB[0]!.fields.projection_fingerprint !== beforeReplayFingerprint) {
    throw new Error('STAGING_RULE_B_MUTATED_EVIDENCE');
  }

  const tampered: ProjectionEnvelope = {
    ...envelope,
    runtimeTraceId: `${envelope.runtimeTraceId}-tampered`,
  };
  let ruleCConflict = false;
  try {
    await adapter.deliverWithReceipt(tampered);
  } catch (error) {
    if (error instanceof EvidenceIntegrityConflict) ruleCConflict = true;
    else throw error;
  }
  if (!ruleCConflict) throw new Error('STAGING_RULE_C_CONFLICT_NOT_RAISED');

  const afterRuleC = await adapter.findByAttemptId(envelope.attemptId);
  if (afterRuleC.length !== 1) throw new Error('STAGING_RULE_C_CARDINALITY_FAILED');
  if (afterRuleC[0]!.id !== beforeReplayRecordId) {
    throw new Error('STAGING_RULE_C_CREATED_RECORD');
  }
  if (afterRuleC[0]!.fields.projection_fingerprint !== fingerprint) {
    throw new Error('STAGING_RULE_C_MUTATED_EXISTING_EVIDENCE');
  }

  const faultEnvelope = makeEnvelope(`${acceptanceRunId}-fault`);
  const canonicalFingerprintBefore = generateProjectionFingerprint(faultEnvelope);
  const outboxState: MutableAcceptanceOutbox = {
    item: {
      outboxId: randomUUID(),
      attemptId: faultEnvelope.attemptId,
      projectionPayload: faultEnvelope,
      retryCount: 0,
    },
    status: 'PENDING',
    retryCount: 0,
    processedAt: null,
    nextAttemptAt: null,
    lastErrorCode: null,
  };
  const faultStore = new AcceptanceOutboxStore(outboxState);
  const faultAdapter = new RealAirtableStagingAdapter({
    baseId: config.baseId,
    tableId: config.tableId,
    token: config.token,
    timeoutMs: config.timeoutMs,
    acceptanceRunId,
    faultMode: 'TIMEOUT_BEFORE_NETWORK',
  });
  const fixedNow = new Date();
  const worker = new BookingAttemptOutboxWorker(faultStore, faultAdapter, {
    now: () => fixedNow,
    processingLeaseMs: 2_000,
    retryDelayMs: () => 1_000,
  });
  const networkResult = await worker.runOnce();
  const canonicalFingerprintAfter = generateProjectionFingerprint(faultEnvelope);

  if (networkResult.status !== 'RETRY_SCHEDULED') {
    throw new Error('STAGING_NETWORK_FAILURE_NOT_RETRYABLE');
  }
  if (outboxState.retryCount !== 1) throw new Error('STAGING_NETWORK_RETRY_COUNT_INVALID');
  if (outboxState.processedAt !== null) throw new Error('STAGING_NETWORK_PROCESSED_AT_NOT_NULL');
  if (!outboxState.nextAttemptAt) throw new Error('STAGING_NETWORK_NEXT_ATTEMPT_NOT_SET');
  if (canonicalFingerprintBefore !== canonicalFingerprintAfter) {
    throw new Error('STAGING_NETWORK_CANONICAL_ENVELOPE_CHANGED');
  }

  const evidence = {
    contract: 'REAL AIRTABLE STAGING ACCEPTANCE',
    status: 'PASS',
    scope: 'STAGING ONLY — NO PRODUCTION AUTHORITY',
    acceptanceRunId,
    expectedHeadSha: expectedHead,
    generatedAt: new Date().toISOString(),
    preflight,
    ruleA: {
      pass: true,
      realAirtableRequest: true,
      recordId: ruleAReceipt.recordId,
      physicalRecordCount: afterRuleA.length,
      fingerprint,
    },
    ruleB: {
      pass: true,
      recordIdStable: ruleBReceipt.recordId === beforeReplayRecordId,
      physicalRecordCount: afterRuleB.length,
      newRecordCreated: false,
      existingRecordModified: false,
    },
    ruleC: {
      pass: true,
      result: 'EvidenceIntegrityConflict',
      terminal: true,
      physicalRecordCount: afterRuleC.length,
      additionalRecordCreated: false,
      existingRecordModified: false,
    },
    networkFailure: {
      pass: true,
      faultBoundary: 'TIMEOUT_BEFORE_NETWORK',
      realAdapterPath: true,
      workerResult: networkResult.status,
      outboxStatus: outboxState.status,
      retryCount: outboxState.retryCount,
      processedAt: null,
      nextAttemptAtSet: Boolean(outboxState.nextAttemptAt),
      canonicalEnvelopeChanged: false,
    },
    governance: {
      technicalTraceabilityPreviouslyProven: true,
      stagingAcceptanceOnly: true,
      mergeAuthority: 'NOT GRANTED',
      productionAuthority: 'NOT GRANTED',
      productionMigration: 'NOT AUTHORIZED',
    },
  };

  await writeFile(config.acceptanceEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`, {
    encoding: 'utf-8',
    mode: 0o600,
  });

  console.log(
    JSON.stringify({
      status: evidence.status,
      acceptanceRunId,
      credential_present: true,
      credential_logged: false,
      evidencePath: config.acceptanceEvidencePath,
    }),
  );
}

main().catch((error) => {
  const safe = {
    status: 'FAIL',
    error:
      error instanceof Error
        ? `${error.name}:${error.message}`.slice(0, 512)
        : 'UNKNOWN_STAGING_ACCEPTANCE_ERROR',
    credential_present: Boolean(process.env.AIRTABLE_STAGING_TOKEN),
    credential_logged: false,
  };
  console.error(JSON.stringify(safe));
  process.exitCode = 1;
});
