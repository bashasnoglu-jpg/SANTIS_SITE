import { createHash } from 'node:crypto';

import type { ProjectionEnvelope } from './contracts.js';
import type { EvidenceProjectionTransport } from './outbox-worker.js';

export const EVIDENCE_INTEGRITY_CONFLICT = 'EVIDENCE_INTEGRITY_CONFLICT' as const;

export class EvidenceIntegrityConflict extends Error {
  readonly code = EVIDENCE_INTEGRITY_CONFLICT;
  readonly retryable = false as const;

  constructor(readonly attemptId: string) {
    super(`Evidence integrity conflict for attempt ${attemptId}`);
    this.name = 'EvidenceIntegrityConflict';
  }
}

/**
 * Hashes the complete sealed projection envelope in a fixed field order.
 * Optional values are normalized to null so object key order cannot change identity.
 */
export function generateProjectionFingerprint(envelope: ProjectionEnvelope): string {
  const canonical = JSON.stringify([
    envelope.contractVersion,
    envelope.attemptId,
    envelope.requestId,
    envelope.idempotencyKey,
    envelope.requestFingerprint,
    envelope.postgresClaimId,
    envelope.writerCommitSha,
    envelope.runtimeTraceId,
    envelope.outcome,
    envelope.reasonCode ?? null,
    envelope.canonicalBookingId ?? null,
    envelope.claimedAt,
    envelope.finalizedAt,
  ]);

  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`;
}

interface StoredEvidence {
  fingerprint: string;
  envelope: ProjectionEnvelope;
}

/**
 * Repository/CI-only receiver used to prove the Airtable-side idempotency contract.
 * It performs no network access and contains no Airtable identifiers or credentials.
 */
export class MockAirtableEvidenceAdapter implements EvidenceProjectionTransport {
  private readonly store = new Map<string, StoredEvidence>();
  transportCalls = 0;
  logicalWrites = 0;

  get size(): number {
    return this.store.size;
  }

  get(attemptId: string): ProjectionEnvelope | undefined {
    const stored = this.store.get(attemptId);
    return stored ? structuredClone(stored.envelope) : undefined;
  }

  async deliver(envelope: ProjectionEnvelope): Promise<void> {
    this.transportCalls += 1;
    const fingerprint = generateProjectionFingerprint(envelope);
    const existing = this.store.get(envelope.attemptId);

    // RULE A — new evidence: one logical insert.
    if (!existing) {
      this.store.set(envelope.attemptId, {
        fingerprint,
        envelope: structuredClone(envelope),
      });
      this.logicalWrites += 1;
      return;
    }

    // RULE B — exact replay: successful no-op, never a second write.
    if (existing.fingerprint === fingerprint) {
      return;
    }

    // RULE C — same identity with different sealed evidence: terminal fail-closed.
    throw new EvidenceIntegrityConflict(envelope.attemptId);
  }
}
