import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  EvidenceSchema,
  SignedEvidenceSchema,
  type ModelReview,
  type ReviewRequest,
  type SignedEvidence
} from "./contracts.js";

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createSignedEvidence(
  request: ReviewRequest,
  review: ModelReview,
  config: { model: string; region: string; signingKey: string; now?: Date }
): SignedEvidence {
  const evidence = EvidenceSchema.parse({
    schema_version: "1.0",
    evidence_id: randomUUID(),
    request_id: request.requestId,
    generated_at: (config.now ?? new Date()).toISOString(),
    mode: "shadow",
    binding_status: "NON_BINDING",
    human_review_status: "NOT_EVALUATED",
    ai_disclosure:
      "AI-generated pre-review evidence. A human reviewer must independently verify every finding.",
    content_provenance: {
      provider: "google-vertex-ai",
      model: config.model,
      region: config.region,
      repository_id: request.repository.id,
      pull_request_number: request.pullRequest.number,
      base_sha: request.pullRequest.baseSha,
      head_sha: request.pullRequest.headSha,
      diff_sha256: request.diff.sha256
    },
    review
  });

  const signature = createHmac("sha256", config.signingKey)
    .update(canonicalJson(evidence))
    .digest("hex");

  return SignedEvidenceSchema.parse({
    evidence,
    signature: { algorithm: "HMAC-SHA256", value: signature }
  });
}

export function verifyEvidenceSignature(envelope: SignedEvidence, signingKey: string): boolean {
  const expected = createHmac("sha256", signingKey)
    .update(canonicalJson(envelope.evidence))
    .digest("hex");
  const actualBuffer = Buffer.from(envelope.signature.value, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
