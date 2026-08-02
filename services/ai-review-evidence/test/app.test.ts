import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { evaluateRequest, type AppConfig } from "../src/app.js";

const diffContent = "diff --git a/src/a.ts b/src/a.ts\n+const safe = true;\n";
const config: AppConfig = {
  mode: "shadow",
  projectId: "santis-ai-review",
  region: "europe-west1",
  model: "gemini-2.5-flash",
  signingKey: "test-only-signing-key-with-32-bytes-minimum",
  repositoryId: "1146035054",
  ownerId: "241850015"
};

function rawRequest(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides
  };
}

test("fails closed outside shadow mode", async () => {
  const result = await evaluateRequest(rawRequest(), { ...config, mode: "production" });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "AI_REVIEW_MODE_MUST_BE_SHADOW");
});

test("denies fork payloads before any model call", async () => {
  const request = rawRequest();
  request.source.fork = true;
  request.pullRequest.headRepositoryId = "999";
  const result = await evaluateRequest(request, config);
  assert.equal(result.status, 403);
  assert.equal(result.body.error, "FORK_REVIEW_DENIED");
});

test("rejects digest mismatch before any model call", async () => {
  const request = rawRequest();
  request.diff.sha256 = "f".repeat(64);
  const result = await evaluateRequest(request, config);
  assert.equal(result.status, 422);
  assert.equal(result.body.error, "DIFF_DIGEST_MISMATCH");
});

test("rejects ignored sensitive paths", async () => {
  const request = rawRequest();
  request.diff.files[0].path = ".env.production";
  const result = await evaluateRequest(request, config);
  assert.equal(result.status, 422);
  assert.equal(result.body.error, "FORBIDDEN_PATH_IN_DIFF");
});
