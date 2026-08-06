import assert from "node:assert/strict";
import {
  constants,
  createHash,
  generateKeyPairSync,
  sign
} from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const preflightScript = fileURLToPath(new URL("../scripts/workflow-preflight.mjs", import.meta.url));
const evidenceScript = fileURLToPath(
  new URL("../scripts/validate-evidence-response.mjs", import.meta.url)
);
const content = "### src/a.ts\n@@ -0,0 +1 @@\n+const safe = true;";
const keyVersion =
  "projects/santis-ai-review/locations/europe-west1/keyRings/evidence/cryptoKeys/shadow/cryptoKeyVersions/1";
const signer = generateKeyPairSync("rsa", { modulusLength: 2048 });
const wrongSigner = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicKeyPem = signer.publicKey.export({ type: "spki", format: "pem" }).toString();
const wrongPublicKeyPem = wrongSigner.publicKey
  .export({ type: "spki", format: "pem" })
  .toString();

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function inputFixture() {
  return {
    schemaVersion: "1.0",
    requestId: "8d7d96ba-342f-4e8d-aa5e-2a60b36d575d",
    repository: {
      fullName: "bashasnoglu-jpg/SANTIS_SITE",
      id: "1146035054",
      ownerId: "241850015"
    },
    pullRequest: {
      number: 372,
      baseSha: "a".repeat(40),
      headSha: "b".repeat(40),
      headRepositoryId: "1146035054"
    },
    source: { eventName: "pull_request", workflowRunId: "123456", fork: false },
    diff: {
      sha256: createHash("sha256").update(content).digest("hex"),
      content,
      files: [{ path: "src/a.ts", status: "modified", additions: 1, deletions: 0 }]
    },
    preparation: {
      ignoredFileCount: 0,
      includedFileCount: 1,
      redactionCount: 0,
      truncated: false
    }
  };
}

function evidenceFixture(input) {
  const evidence = {
    schema_version: "1.0",
    evidence_id: "663df1b6-237f-4d8e-aea1-190d0de8ee1a",
    request_id: input.requestId,
    generated_at: "2026-08-03T05:00:00.000Z",
    mode: "shadow",
    binding_status: "NON_BINDING",
    human_review_status: "NOT_EVALUATED",
    ai_disclosure:
      "AI-generated pre-review evidence. A human reviewer must independently verify every finding.",
    content_provenance: {
      provider: "google-vertex-ai",
      model: "gemini-2.5-flash",
      region: "europe-west1",
      repository_id: input.repository.id,
      pull_request_number: input.pullRequest.number,
      base_sha: input.pullRequest.baseSha,
      head_sha: input.pullRequest.headSha,
      diff_sha256: input.diff.sha256
    },
    review: { summary: "Non-binding test evidence.", findings: [], limitations: [] }
  };
  const canonicalEvidence = Buffer.from(canonicalJson(evidence), "utf8");
  const signature = sign("sha256", canonicalEvidence, {
    key: signer.privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST
  }).toString("base64");
  return {
    evidence,
    signature: {
      algorithm: "GOOGLE_CLOUD_KMS_RSA_PSS_SHA256",
      key_version: keyVersion,
      value: signature
    }
  };
}

const preflightEnvironment = {
  ...process.env,
  EXPECTED_REPOSITORY_ID: "1146035054",
  EXPECTED_OWNER_ID: "241850015",
  EXPECTED_WORKFLOW_RUN_ID: "123456",
  EXPECTED_PULL_REQUEST_NUMBER: "372",
  EXPECTED_BASE_SHA: "a".repeat(40),
  EXPECTED_HEAD_SHA: "b".repeat(40),
  FAIL_ON_INELIGIBLE: "true"
};

const verificationEnvironment = {
  ...process.env,
  EVIDENCE_KMS_KEY_VERSION: keyVersion,
  EVIDENCE_KMS_PUBLIC_KEY_PEM: publicKeyPem
};

async function runEvidenceValidation({ input = inputFixture(), envelope, env = verificationEnvironment } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "ai-review-evidence-"));
  const inputPath = join(directory, "input.json");
  const evidencePath = join(directory, "evidence.json");
  const signed = envelope ?? evidenceFixture(input);
  await writeFile(inputPath, JSON.stringify(input));
  await writeFile(evidencePath, JSON.stringify(signed));
  return spawnSync(process.execPath, [evidenceScript, inputPath, evidencePath], {
    env,
    encoding: "utf8"
  });
}

test("strict workflow preflight binds artifact to the triggering run", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ai-review-preflight-"));
  const inputPath = join(directory, "input.json");
  await writeFile(inputPath, JSON.stringify(inputFixture()));

  const valid = spawnSync(process.execPath, [preflightScript, inputPath], {
    env: preflightEnvironment,
    encoding: "utf8"
  });
  assert.equal(valid.status, 0, valid.stderr);

  const wrongRun = spawnSync(process.execPath, [preflightScript, inputPath], {
    env: { ...preflightEnvironment, EXPECTED_WORKFLOW_RUN_ID: "999999" },
    encoding: "utf8"
  });
  assert.notEqual(wrongRun.status, 0);
});

test("workflow preflight rejects truncated artifacts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ai-review-truncated-"));
  const inputPath = join(directory, "input.json");
  const input = inputFixture();
  input.preparation.truncated = true;
  await writeFile(inputPath, JSON.stringify(input));
  const result = spawnSync(process.execPath, [preflightScript, inputPath], {
    env: preflightEnvironment,
    encoding: "utf8"
  });
  assert.notEqual(result.status, 0);
});

test("response validator accepts a valid KMS signature", async () => {
  const result = await runEvidenceValidation();
  assert.equal(result.status, 0, result.stderr);
});

test("response validator rejects tampered evidence", async () => {
  const input = inputFixture();
  const envelope = evidenceFixture(input);
  envelope.evidence.review.summary = "Tampered after signing";
  const result = await runEvidenceValidation({ input, envelope });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cryptographic signature verification failed/);
});

test("response validator rejects the wrong public key", async () => {
  const result = await runEvidenceValidation({
    env: { ...verificationEnvironment, EVIDENCE_KMS_PUBLIC_KEY_PEM: wrongPublicKeyPem }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cryptographic signature verification failed/);
});

test("response validator rejects the wrong KMS key version", async () => {
  const result = await runEvidenceValidation({
    env: {
      ...verificationEnvironment,
      EVIDENCE_KMS_KEY_VERSION: keyVersion.replace(/\/1$/, "/2")
    }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /KMS key version mismatch/);
});

test("response validator rejects a missing signature", async () => {
  const input = inputFixture();
  const envelope = evidenceFixture(input);
  delete envelope.signature.value;
  const result = await runEvidenceValidation({ input, envelope });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /signature missing/);
});

test("response validator rejects replay against a different request", async () => {
  const originalInput = inputFixture();
  const envelope = evidenceFixture(originalInput);
  const replayInput = inputFixture();
  replayInput.requestId = "c79ae93d-1d4c-49d8-8aa0-7c6509e7a9ee";
  replayInput.diff.sha256 = "f".repeat(64);
  const result = await runEvidenceValidation({ input: replayInput, envelope });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /request ID mismatch|diff digest mismatch/);
});

test("response validator rejects a corrupted signature", async () => {
  const input = inputFixture();
  const envelope = evidenceFixture(input);
  // Corrupt the signature deterministically by flipping one bit
  const sigBuffer = Buffer.from(envelope.signature.value, "base64");
  sigBuffer[0] ^= 1;
  envelope.signature.value = sigBuffer.toString("base64");
  const result = await runEvidenceValidation({ input, envelope });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cryptographic signature verification failed/);
});
