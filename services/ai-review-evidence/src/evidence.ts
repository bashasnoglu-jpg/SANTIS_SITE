import {
  constants,
  createHash,
  randomUUID,
  verify as verifySignature
} from "node:crypto";
import {
  EvidenceSchema,
  SignedEvidenceSchema,
  type ModelReview,
  type ReviewRequest,
  type SignedEvidence
} from "./contracts.js";

const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

export function canonicalJson(value: unknown): string {
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

async function getAccessToken(): Promise<string> {
  const response = await fetch(METADATA_TOKEN_URL, {
    headers: { "Metadata-Flavor": "Google" },
    signal: AbortSignal.timeout(5_000)
  });
  if (!response.ok) {
    throw new Error(`KMS metadata token request failed: ${response.status}`);
  }
  const payload = (await response.json()) as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || payload.access_token.length < 20) {
    throw new Error("KMS metadata token response was invalid");
  }
  return payload.access_token;
}

async function signDigestWithKms(keyVersion: string, digest: Buffer): Promise<string> {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `https://cloudkms.googleapis.com/v1/${keyVersion}:asymmetricSign`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ digest: { sha256: digest.toString("base64") } }),
      signal: AbortSignal.timeout(30_000)
    }
  );
  if (!response.ok) {
    throw new Error(`KMS asymmetric sign failed: ${response.status}`);
  }
  const payload = (await response.json()) as { signature?: unknown };
  if (typeof payload.signature !== "string" || payload.signature.length < 64) {
    throw new Error("KMS asymmetric sign response was invalid");
  }
  return payload.signature;
}

export async function createSignedEvidence(
  request: ReviewRequest,
  review: ModelReview,
  config: {
    model: string;
    region: string;
    kmsKeyVersion: string;
    now?: Date;
    signDigest?: (digest: Buffer) => Promise<string>;
  }
): Promise<SignedEvidence> {
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

  const digest = createHash("sha256").update(canonicalJson(evidence)).digest();
  const signature = await (config.signDigest ?? ((value) => signDigestWithKms(config.kmsKeyVersion, value)))(digest);

  return SignedEvidenceSchema.parse({
    evidence,
    signature: {
      algorithm: "GOOGLE_CLOUD_KMS_RSA_PSS_SHA256",
      key_version: config.kmsKeyVersion,
      value: signature
    }
  });
}

export function verifyEvidenceSignature(
  envelope: SignedEvidence,
  publicKeyPem: string
): boolean {
  const digest = createHash("sha256").update(canonicalJson(envelope.evidence)).digest();
  return verifySignature(
    null,
    digest,
    {
      key: publicKeyPem,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32
    },
    Buffer.from(envelope.signature.value, "base64")
  );
}
