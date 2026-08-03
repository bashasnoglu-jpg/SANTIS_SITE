import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
      files: [
        { path: "src/a.ts", status: "modified", additions: 1, deletions: 0 }
      ]
    },
    preparation: {
      ignoredFileCount: 0,
      includedFileCount: 1,
      redactionCount: 0,
      truncated: false
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
  assert.match(wrongRun.stderr, /strict provenance validation/);
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

test("response validator binds evidence provenance to the prepared request", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ai-review-evidence-"));
  const inputPath = join(directory, "input.json");
  const evidencePath = join(directory, "evidence.json");
  const input = inputFixture();
  const evidence = {
    evidence: {
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
    },
    signature: { algorithm: "HMAC-SHA256", value: "c".repeat(64) }
  };
  await writeFile(inputPath, JSON.stringify(input));
  await writeFile(evidencePath, JSON.stringify(evidence));

  const valid = spawnSync(process.execPath, [evidenceScript, inputPath, evidencePath], {
    encoding: "utf8"
  });
  assert.equal(valid.status, 0, valid.stderr);

  evidence.evidence.content_provenance.head_sha = "d".repeat(40);
  await writeFile(evidencePath, JSON.stringify(evidence));
  const mismatch = spawnSync(process.execPath, [evidenceScript, inputPath, evidencePath], {
    encoding: "utf8"
  });
  assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /head SHA mismatch/);
});
