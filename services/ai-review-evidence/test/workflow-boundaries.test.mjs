import assert from "node:assert/strict";
import {
  constants,
  createHash,
  generateKeyPairSync,
  sign
} from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { prepareReviewPackage, writeReviewPackage } from "../scripts/prepare-diff.mjs";

const preflightScript = fileURLToPath(new URL("../scripts/workflow-preflight.mjs", import.meta.url));
const evidenceScript = fileURLToPath(new URL("../scripts/validate-evidence-response.mjs", import.meta.url));
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const prepareWorkflowPath = resolve(repositoryRoot, ".github/workflows/ai-pre-review-prepare.yml");
const evaluateWorkflowPath = resolve(repositoryRoot, ".github/workflows/ai-pre-review-evaluate.yml");

const keyVersion =
  "projects/santis-ai-review/locations/europe-west1/keyRings/evidence/cryptoKeys/shadow/cryptoKeyVersions/1";
const signer = generateKeyPairSync("rsa", { modulusLength: 2048 });
const wrongSigner = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicKeyPem = signer.publicKey.export({ type: "spki", format: "pem" }).toString();
const wrongPublicKeyPem = wrongSigner.publicKey.export({ type: "spki", format: "pem" }).toString();

const expected = {
  repositoryId: "1146035054",
  ownerId: "241850015",
  workflowRunId: "123456",
  pullRequestNumber: "382",
  baseSha: "a".repeat(40),
  headSha: "b".repeat(40)
};

const preflightEnvironment = {
  ...process.env,
  EXPECTED_REPOSITORY_ID: expected.repositoryId,
  EXPECTED_OWNER_ID: expected.ownerId,
  EXPECTED_WORKFLOW_RUN_ID: expected.workflowRunId,
  EXPECTED_PULL_REQUEST_NUMBER: expected.pullRequestNumber,
  EXPECTED_BASE_SHA: expected.baseSha,
  EXPECTED_HEAD_SHA: expected.headSha,
  FAIL_ON_INELIGIBLE: "true"
};

const verificationEnvironment = {
  ...process.env,
  EVIDENCE_KMS_KEY_VERSION: keyVersion,
  EVIDENCE_KMS_PUBLIC_KEY_PEM: publicKeyPem
};

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
  const digest = createHash("sha256").update(canonicalJson(evidence)).digest();
  const signature = sign(null, digest, {
    key: signer.privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32
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

async function preparedPackage({ multipart = true } = {}) {
  const files = multipart
    ? [
        { filename: "src/a.ts", patch: "a".repeat(70_000), status: "added", additions: 1, deletions: 0 },
        { filename: "src/b.ts", patch: "b".repeat(70_000), status: "added", additions: 1, deletions: 0 }
      ]
    : [
        { filename: "src/a.ts", patch: "+const safe = true;", status: "added", additions: 1, deletions: 0 }
      ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const page = Number(new URL(url).searchParams.get("page"));
    const start = (page - 1) * 100;
    return new Response(JSON.stringify(files.slice(start, start + 100)), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };
  try {
    return await prepareReviewPackage({
      event: {
        action: "opened",
        repository: {
          id: Number(expected.repositoryId),
          full_name: "bashasnoglu-jpg/SANTIS_SITE",
          owner: { id: Number(expected.ownerId) }
        },
        pull_request: {
          number: Number(expected.pullRequestNumber),
          base: { sha: expected.baseSha },
          head: { sha: expected.headSha, repo: { id: Number(expected.repositoryId) } }
        }
      },
      token: "synthetic-token-not-a-credential",
      apiUrl: "https://api.github.test",
      runId: expected.workflowRunId,
      ignoreContent: ""
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function materializePackage(options) {
  const directory = await mkdtemp(join(tmpdir(), "ai-review-preflight-"));
  const prepared = await preparedPackage(options);
  await writeReviewPackage(directory, prepared);
  return {
    directory,
    manifestPath: join(directory, "review-manifest.json"),
    prepared
  };
}

function runPreflight(manifestPath, env = preflightEnvironment) {
  return spawnSync(process.execPath, [preflightScript, manifestPath], {
    env,
    encoding: "utf8"
  });
}

async function rewriteManifest(manifestPath, mutate) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  mutate(manifest);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return manifest;
}

async function rewritePart(manifestPath, index, mutate) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const partPath = join(dirname(manifestPath), manifest.parts[index - 1].path);
  const part = JSON.parse(await readFile(partPath, "utf8"));
  mutate(part);
  await writeFile(partPath, JSON.stringify(part, null, 2));
}

function runEvidenceValidation(input, envelope, env = verificationEnvironment) {
  return (async () => {
    const directory = await mkdtemp(join(tmpdir(), "ai-review-evidence-"));
    const inputPath = join(directory, "input.json");
    const evidencePath = join(directory, "evidence.json");
    await writeFile(inputPath, JSON.stringify(input));
    await writeFile(evidencePath, JSON.stringify(envelope));
    return spawnSync(process.execPath, [evidenceScript, inputPath, evidencePath], {
      env,
      encoding: "utf8"
    });
  })();
}

test("AR-MAN-001 strict preflight accepts a complete valid multipart package", async () => {
  const { manifestPath, prepared } = await materializePackage();
  assert.equal(prepared.parts.length, 2);
  const result = runPreflight(manifestPath);
  assert.equal(result.status, 0, result.stderr);
});

test("AR-MAN-002 truncated part is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewritePart(manifestPath, 1, (part) => { part.preparation.truncated = true; });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-003 missing part is rejected", async () => {
  const { manifestPath, prepared } = await materializePackage();
  await rm(join(dirname(manifestPath), prepared.manifest.parts[1].path));
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-004 duplicate part index is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.parts[1].index = 1; });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-005 duplicate request ID is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => {
    manifest.parts[1].requestId = manifest.parts[0].requestId;
  });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-006 extra unmanifested part is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await writeFile(join(dirname(manifestPath), "parts/review-input-9999.json"), "{}");
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-007 tampered part content is rejected by digest validation", async () => {
  const { manifestPath } = await materializePackage();
  await rewritePart(manifestPath, 1, (part) => { part.diff.content += "tampered"; });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-008 wrong repository is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.repository.id = "999"; });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-009 wrong PR number is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.pullRequest.number = 999; });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-010 wrong base SHA is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.pullRequest.baseSha = "c".repeat(40); });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-011 wrong head SHA is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.pullRequest.headSha = "d".repeat(40); });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-012 wrong workflow run is rejected", async () => {
  const { manifestPath } = await materializePackage();
  const result = runPreflight(manifestPath, { ...preflightEnvironment, EXPECTED_WORKFLOW_RUN_ID: "999999" });
  assert.notEqual(result.status, 0);
});

test("AR-MAN-013 forked source is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.source.fork = true; });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-014 reordered manifest parts are rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.parts.reverse(); });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-MAN-015 tampered coverage digest is rejected", async () => {
  const { manifestPath } = await materializePackage();
  await rewriteManifest(manifestPath, (manifest) => { manifest.coverage.coverageSha256 = "f".repeat(64); });
  assert.notEqual(runPreflight(manifestPath).status, 0);
});

test("AR-EVAL-001 all signed responses validate independently for a multipart package", async () => {
  const prepared = await preparedPackage();
  const results = [];
  for (const part of prepared.parts) {
    results.push(await runEvidenceValidation(part, evidenceFixture(part)));
  }
  assert.deepEqual(results.map((result) => result.status), [0, 0]);
});

test("AR-EVAL-002 workflow fails closed on any non-200 part response", async () => {
  const workflow = await readFile(evaluateWorkflowPath, "utf8");
  assert.match(workflow, /set -euo pipefail/);
  assert.match(workflow, /test "\$\{HTTP_STATUS\}" = "200"/);
  assert.match(workflow, /for relative_part in "\$\{PART_PATHS\[@\]\}"/);
});

test("AR-EVAL-003 request ID mismatch on one part is rejected", async () => {
  const prepared = await preparedPackage();
  const envelope = evidenceFixture(prepared.parts[1]);
  envelope.evidence.request_id = "c79ae93d-1d4c-49d8-8aa0-7c6509e7a9ee";
  const result = await runEvidenceValidation(prepared.parts[1], envelope);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /request ID mismatch/);
});

test("AR-EVAL-004 diff digest mismatch on one part is rejected", async () => {
  const prepared = await preparedPackage();
  const envelope = evidenceFixture(prepared.parts[1]);
  envelope.evidence.content_provenance.diff_sha256 = "f".repeat(64);
  const digest = createHash("sha256").update(canonicalJson(envelope.evidence)).digest();
  envelope.signature.value = sign(null, digest, {
    key: signer.privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32
  }).toString("base64");
  const result = await runEvidenceValidation(prepared.parts[1], envelope);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /diff digest mismatch/);
});

test("AR-EVAL-005 invalid KMS signature on any part rejects that part", async () => {
  const prepared = await preparedPackage();
  const envelope = evidenceFixture(prepared.parts[1]);
  envelope.evidence.review.summary = "Tampered after signing";
  const result = await runEvidenceValidation(prepared.parts[1], envelope);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cryptographic signature verification failed/);
});

test("AR-EVAL-006 wrong KMS key version is rejected", async () => {
  const prepared = await preparedPackage({ multipart: false });
  const result = await runEvidenceValidation(
    prepared.parts[0],
    evidenceFixture(prepared.parts[0]),
    { ...verificationEnvironment, EVIDENCE_KMS_KEY_VERSION: keyVersion.replace(/\/1$/, "/2") }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /KMS key version mismatch/);
});

test("AR-EVAL-007 workflow uploads evidence only after all parts are validated and counted", async () => {
  const workflow = await readFile(evaluateWorkflowPath, "utf8");
  const loop = workflow.indexOf('for relative_part in "${PART_PATHS[@]}"');
  const validate = workflow.indexOf("validate-evidence-response.mjs");
  const count = workflow.indexOf("find signed-evidence -name '*-evidence.json'");
  const upload = workflow.indexOf("- name: Upload complete signed evidence package");
  assert.ok(loop >= 0 && validate > loop && count > validate && upload > count);
});

test("AR-EVAL-008 wrong public key is rejected", async () => {
  const prepared = await preparedPackage({ multipart: false });
  const result = await runEvidenceValidation(
    prepared.parts[0],
    evidenceFixture(prepared.parts[0]),
    { ...verificationEnvironment, EVIDENCE_KMS_PUBLIC_KEY_PEM: wrongPublicKeyPem }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cryptographic signature verification failed/);
});

test("AR-EVAL-009 missing signature is rejected", async () => {
  const prepared = await preparedPackage({ multipart: false });
  const envelope = evidenceFixture(prepared.parts[0]);
  delete envelope.signature.value;
  const result = await runEvidenceValidation(prepared.parts[0], envelope);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /signature missing/);
});

test("AR-EVAL-010 missing evidence part cannot satisfy workflow completion count", async () => {
  const workflow = await readFile(evaluateWorkflowPath, "utf8");
  assert.match(workflow, /wc -l\)" -eq "\$\{#PART_PATHS\[@\]\}"/);
});

test("AR-WF-001 prepare workflow retains trusted-base checkout and read-only permissions", async () => {
  const workflow = await readFile(prepareWorkflowPath, "utf8");
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pull-requests: read/);
  assert.doesNotMatch(workflow, /contents: write|pull-requests: write/);
});

test("AR-WF-002 prepare workflow uploads manifest plus parts directory", async () => {
  const workflow = await readFile(prepareWorkflowPath, "utf8");
  assert.match(workflow, /review-manifest\.json/);
  assert.match(workflow, /path: ai-pre-review-input\//);
});

test("AR-WF-003 evaluate workflow validates complete package before Google authentication", async () => {
  const workflow = await readFile(evaluateWorkflowPath, "utf8");
  const revalidate = workflow.indexOf("Revalidate complete package before Google authentication");
  const authenticate = workflow.indexOf("Authenticate through Workload Identity Federation");
  assert.ok(revalidate >= 0 && authenticate > revalidate);
});
