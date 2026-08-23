import type { ProjectionEnvelope } from '../src/booking-attempt/contracts.js';
import {
  EvidenceIntegrityConflict,
  generateProjectionFingerprint,
} from '../src/booking-attempt/mock-airtable-evidence-adapter.js';
import type { EvidenceProjectionTransport } from '../src/booking-attempt/outbox-worker.js';

export interface AirtableStagingAdapterConfig {
  baseId: string;
  tableId: string;
  token: string;
  timeoutMs: number;
  acceptanceRunId: string;
  faultMode?: 'NONE' | 'TIMEOUT_BEFORE_NETWORK';
}

export interface StagingEvidenceRecord {
  id: string;
  fields: Record<string, unknown>;
}

export interface AirtableDeliveryReceipt {
  recordId: string;
  created: boolean;
  fingerprint: string;
}

export class StagingInjectedTimeout extends Error {
  readonly code = 'STAGING_INJECTED_TIMEOUT';
  readonly retryable = true as const;

  constructor() {
    super('Controlled staging timeout before Airtable network dispatch');
    this.name = 'StagingInjectedTimeout';
  }
}

function airtableFormulaString(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function envelopeFields(
  envelope: ProjectionEnvelope,
  acceptanceRunId: string,
  fingerprint: string,
): Record<string, string> {
  return {
    contract_version: envelope.contractVersion,
    attempt_id: envelope.attemptId,
    request_id: envelope.requestId,
    idempotency_key: envelope.idempotencyKey,
    request_fingerprint: envelope.requestFingerprint,
    postgres_claim_id: envelope.postgresClaimId,
    writer_commit_sha: envelope.writerCommitSha,
    runtime_trace_id: envelope.runtimeTraceId,
    outcome: envelope.outcome,
    reason_code: envelope.reasonCode ?? '',
    canonical_booking_id: envelope.canonicalBookingId ?? '',
    claimed_at: envelope.claimedAt,
    finalized_at: envelope.finalizedAt,
    projection_fingerprint: fingerprint,
    acceptance_run_id: acceptanceRunId,
  };
}

export class RealAirtableStagingAdapter implements EvidenceProjectionTransport {
  private readonly endpoint: string;
  private faultConsumed = false;

  constructor(private readonly config: AirtableStagingAdapterConfig) {
    this.endpoint = `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(config.tableId)}`;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    if (this.config.faultMode === 'TIMEOUT_BEFORE_NETWORK' && !this.faultConsumed) {
      this.faultConsumed = true;
      throw new StagingInjectedTimeout();
    }

    const signal = AbortSignal.timeout(this.config.timeoutMs);
    const response = await fetch(url, { ...init, signal });
    if (!response.ok) {
      const body = (await response.text()).slice(0, 512);
      const error = new Error(`AIRTABLE_STAGING_HTTP_${response.status}:${body}`) as Error & {
        code?: string;
        retryable?: boolean;
      };
      error.code = `AIRTABLE_HTTP_${response.status}`;
      error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      throw error;
    }
    return response;
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
    };
  }

  async findByAttemptId(attemptId: string): Promise<StagingEvidenceRecord[]> {
    const params = new URLSearchParams({
      maxRecords: '2',
      filterByFormula: `{attempt_id}=${airtableFormulaString(attemptId)}`,
    });
    const response = await this.request(`${this.endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: this.headers(),
    });
    const body = (await response.json()) as { records?: StagingEvidenceRecord[] };
    return body.records ?? [];
  }

  async deliverWithReceipt(envelope: ProjectionEnvelope): Promise<AirtableDeliveryReceipt> {
    const fingerprint = generateProjectionFingerprint(envelope);
    const existing = await this.findByAttemptId(envelope.attemptId);

    if (existing.length > 1) {
      throw new EvidenceIntegrityConflict(envelope.attemptId);
    }

    if (existing.length === 1) {
      const storedFingerprint = existing[0]?.fields?.projection_fingerprint;
      if (storedFingerprint === fingerprint) {
        return {
          recordId: existing[0]!.id,
          created: false,
          fingerprint,
        };
      }
      throw new EvidenceIntegrityConflict(envelope.attemptId);
    }

    const response = await this.request(this.endpoint, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: ['attempt_id'] },
        records: [
          {
            fields: envelopeFields(
              envelope,
              this.config.acceptanceRunId,
              fingerprint,
            ),
          },
        ],
      }),
    });

    const body = (await response.json()) as {
      records?: Array<{ id: string }>;
      createdRecords?: string[];
    };
    const recordId = body.records?.[0]?.id;
    if (!recordId) throw new Error('AIRTABLE_STAGING_UPSERT_MISSING_RECORD_ID');

    const verification = await this.findByAttemptId(envelope.attemptId);
    if (verification.length !== 1) {
      throw new Error(`AIRTABLE_STAGING_POST_WRITE_CARDINALITY:${verification.length}`);
    }
    if (verification[0]?.fields?.projection_fingerprint !== fingerprint) {
      throw new EvidenceIntegrityConflict(envelope.attemptId);
    }

    return {
      recordId,
      created: Boolean(body.createdRecords?.includes(recordId)),
      fingerprint,
    };
  }

  async deliver(envelope: ProjectionEnvelope): Promise<void> {
    await this.deliverWithReceipt(envelope);
  }
}
