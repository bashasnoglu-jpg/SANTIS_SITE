import assert from "node:assert/strict";
import {
  constants,
  createHash,
  generateKeyPairSync,
  sign
} from "node:crypto";
import test from "node:test";
import { SignedEvidenceSchema, ReviewRequestSchema } from "../src/contracts.js";
import { createSignedEvidence, verifyEvidenceSignature } from "../src/evidence.js";
import { isForbiddenPath, redactSecrets } from "../src/sanitize.js";
import { SIGNATURE_ALGORITHM } from "../constants.mjs";

const diffContent = "diff --git a/src/a.ts b/src/a.ts\n+const safe = true;\n";
const kmsKeyVersion =
  "projects/santis-ai-review/locations/europe-west1/keyRings/evidence/cryptoKeys/shadow/cryptoKeyVersions/1";

function requestFixture() {
  return ReviewRequestSchema.parse({
    schemaVersion: "1.0",
    requestId: "8d7d96ba-342f-4e8d-aa5e-2a60b36d575d",
    repository: {
      fullName: "bashasnoglu-jpg/SANTIS_SITE",
      id: "1146035054",
      ownerId: "241850015"
    },
    pullRequest: {
      number: 371,
      baseSha: "a".repeat(40),
      headSha: "b".repeat(40),
      headRepositoryId: "1146035054"
    },
    source: {
      eventName: "pull_request",
      workflowRunId: "123456",
      fork: false
    },
    diff: {
      sha256: createHash("sha256").update(diffContent).digest("hex"),
      content: diffContent,
      files: [
        {
          path: "src/a.ts",
          status: "modified",
          additions: 1,
          deletions: 0
        }
      ]
    },
    preparation: {
      ignoredFileCount: 0,
      includedFileCount: 1,
      redactionCount: 0,
      truncated: false
    }
  });
}

test("request contract rejects unknown boundary fields", () => {
  assert.throws(() => ReviewRequestSchema.parse({ ...requestFixture(), verdict: "PASS" }));
});

test("request contract rejects truncated preparation", () => {
  const request = requestFixture();
  assert.throws(() =>
    ReviewRequestSchema.parse({
      ...request,
      preparation: { ...request.preparation, truncated: true }
    })
  );
});

test("sensitive paths fail the deny-first path policy", () => {
  assert.equal(isForbiddenPath(".env.production"), true);
  assert.equal(isForbiddenPath("secrets/service-account.json"), true);
  assert.equal(isForbiddenPath("src/review.ts"), false);
});

test("secret-like content is deterministically redacted", () => {
  const result = redactSecrets("token=ghp_abcdefghijklmnopqrstuvwxyz123456");
  assert.equal(result.redactions, 1);
  assert.match(result.content, /\[REDACTED:/);
  assert.doesNotMatch(result.content, /ghp_/);
});

test("entire private key blocks are removed", () => {
  const result = redactSecrets(
    "-----BEGIN PRIVATE KEY-----\nsensitive-body\n-----END PRIVATE KEY-----"
  );
  assert.equal(result.redactions, 1);
  assert.equal(result.content, "[REDACTED:private-key]");
  assert.doesNotMatch(result.content, /sensitive-body/);
});

test("KMS-style RSA-PSS evidence verifies canonical payload and rejects tampering", async () => {
  const signer = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const wrongSigner = generateKeyPairSync("rsa", { modulusLength: 2048 });

  const envelope = await createSignedEvidence(
    requestFixture(),
    {
      summary: "A bounded shadow review was generated.",
      findings: [],
      limitations: ["Human verification is required."]
    },
    {
      model: "gemini-2.5-flash",
      region: "europe-west1",
      kmsKeyVersion,
      now: new Date("2026-08-02T21:00:00.000Z"),
      signDigest: async (_digest, canonicalPayload) =>
        sign(
          "sha256",
          canonicalPayload,
          {
            key: signer.privateKey,
            padding: constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32
          }
        ).toString("base64")
    }
  );

  const publicKeyPem = signer.publicKey.export({ type: "spki", format: "pem" }).toString();
  const wrongPublicKeyPem = wrongSigner.publicKey
    .export({ type: "spki", format: "pem" })
    .toString();

  assert.equal(envelope.evidence.binding_status, "NON_BINDING");
  assert.equal(envelope.evidence.human_review_status, "NOT_EVALUATED");
  assert.equal(envelope.signature.key_version, kmsKeyVersion);
  assert.equal(verifyEvidenceSignature(envelope, publicKeyPem), true);
  assert.equal(verifyEvidenceSignature(envelope, wrongPublicKeyPem), false);

  const tamperedPayload = structuredClone(envelope);
  tamperedPayload.evidence.review.summary = "Tampered after signing";
  assert.equal(verifyEvidenceSignature(tamperedPayload, publicKeyPem), false);

  const tamperedSignature = structuredClone(envelope);
  const signatureBytes = Buffer.from(tamperedSignature.signature.value, "base64");
  signatureBytes[0] ^= 0x01;
  tamperedSignature.signature.value = signatureBytes.toString("base64");
  assert.equal(verifyEvidenceSignature(tamperedSignature, publicKeyPem), false);
});

test("SignedEvidenceSchema accepts canonical algorithm metadata", async () => {
  const baseEnvelope = {
    evidence: {
      schema_version: "1.0",
      evidence_id: "8d7d96ba-342f-4e8d-aa5e-2a60b36d575d",
      request_id: "8d7d96ba-342f-4e8d-aa5e-2a60b36d575e",
      generated_at: "2026-08-02T21:00:00.000Z",
      mode: "shadow",
      binding_status: "NON_BINDING",
      human_review_status: "NOT_EVALUATED",
      ai_disclosure: "AI-generated pre-review evidence. A human reviewer must independently verify every finding.",
      content_provenance: {
        provider: "google-vertex-ai",
        model: "gemini-2.5-flash",
        region: "europe-west1",
        repository_id: "1146035054",
        pull_request_number: 371,
        base_sha: "a".repeat(40),
        head_sha: "b".repeat(40),
        diff_sha256: "c".repeat(64)
      },
      review: {
        summary: "test",
        findings: [],
        limitations: ["test"]
      }
    },
    signature: {
      algorithm: SIGNATURE_ALGORITHM,
      key_version: kmsKeyVersion,
      value: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY="
    }
  };

  assert.doesNotThrow(() => SignedEvidenceSchema.parse(baseEnvelope));
});

test("SignedEvidenceSchema rejects non-canonical algorithm metadata", async () => {
  const baseEnvelope = {
    evidence: {
      schema_version: "1.0",
      evidence_id: "8d7d96ba-342f-4e8d-aa5e-2a60b36d575d",
      request_id: "8d7d96ba-342f-4e8d-aa5e-2a60b36d575e",
      generated_at: "2026-08-02T21:00:00.000Z",
      mode: "shadow",
      binding_status: "NON_BINDING",
      human_review_status: "NOT_EVALUATED",
      ai_disclosure: "AI-generated pre-review evidence. A human reviewer must independently verify every finding.",
      content_provenance: {
        provider: "google-vertex-ai",
        model: "gemini-2.5-flash",
        region: "europe-west1",
        repository_id: "1146035054",
        pull_request_number: 371,
        base_sha: "a".repeat(40),
        head_sha: "b".repeat(40),
        diff_sha256: "c".repeat(64)
      },
      review: {
        summary: "test",
        findings: [],
        limitations: ["test"]
      }
    },
    signature: {
      algorithm: "RSA_SIGN_PSS_2048_SHA256",
      key_version: kmsKeyVersion,
      value: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY="
    }
  };

  assert.throws(() => SignedEvidenceSchema.parse(baseEnvelope));
});
