import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { ReviewRequestSchema } from "../src/contracts.js";
import { evaluateWithVertex } from "../src/vertex.js";

const diffContent = "diff --git a/src/a.ts b/src/a.ts\n+const safe = true;\n";
const request = ReviewRequestSchema.parse({
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
    sha256: createHash("sha256").update(diffContent).digest("hex"),
    content: diffContent,
    files: [{ path: "src/a.ts", status: "modified", additions: 1, deletions: 0 }]
  },
  preparation: {
    ignoredFileCount: 0,
    includedFileCount: 1,
    redactionCount: 0,
    truncated: false
  }
});

const config = {
  projectId: "santis-ai-review",
  region: "europe-west1",
  model: "gemini-2.5-flash"
};

function metadataResponse(): Response {
  return new Response(JSON.stringify({ access_token: "a".repeat(32) }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

test("malformed Vertex model JSON fails closed", async () => {
  let call = 0;
  const fetchImpl: typeof fetch = async () => {
    call += 1;
    if (call === 1) return metadataResponse();
    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: "{not-json" }] } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  await assert.rejects(
    evaluateWithVertex(request, config, { fetchImpl }),
    /Unexpected token|JSON/
  );
});

test("Vertex timeout or aborted request fails closed", async () => {
  let call = 0;
  const fetchImpl: typeof fetch = async () => {
    call += 1;
    if (call === 1) return metadataResponse();
    throw new DOMException("The operation was aborted", "AbortError");
  };

  await assert.rejects(
    evaluateWithVertex(request, config, { fetchImpl, vertexTimeoutMs: 1 }),
    /aborted/i
  );
});

test("Vertex error bodies are not copied into thrown errors", async () => {
  const sensitiveBody = "token=ghp_sensitive_value_that_must_not_leak";
  let call = 0;
  const fetchImpl: typeof fetch = async () => {
    call += 1;
    if (call === 1) return metadataResponse();
    return new Response(sensitiveBody, { status: 500 });
  };

  await assert.rejects(
    async () => evaluateWithVertex(request, config, { fetchImpl }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Vertex request failed: 500");
      assert.doesNotMatch(error.message, /ghp_|sensitive_value|token=/);
      return true;
    }
  );
});
