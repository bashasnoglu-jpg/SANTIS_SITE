import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { ReviewRequestSchema } from "../src/contracts.js";
import { createSignedEvidence, verifyEvidenceSignature } from "../src/evidence.js";
import { isForbiddenPath, redactSecrets } from "../src/sanitize.js";

const diffContent = "diff --git a/src/a.ts b/src/a.ts\n+const safe = true;\n";

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
    }
  });
}

test("request contract rejects unknown boundary fields", () => {
  assert.throws(() => ReviewRequestSchema.parse({ ...requestFixture(), verdict: "PASS" }));
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

test("evidence is fixed to non-binding and not-evaluated", () => {
  const envelope = createSignedEvidence(
    requestFixture(),
    {
      summary: "A bounded shadow review was generated.",
      findings: [],
      limitations: ["Human verification is required."]
    },
    {
      model: "gemini-2.5-flash",
      region: "europe-west1",
      signingKey: "test-only-signing-key-with-32-bytes-minimum",
      now: new Date("2026-08-02T21:00:00.000Z")
    }
  );

  assert.equal(envelope.evidence.binding_status, "NON_BINDING");
  assert.equal(envelope.evidence.human_review_status, "NOT_EVALUATED");
  assert.equal(
    verifyEvidenceSignature(envelope, "test-only-signing-key-with-32-bytes-minimum"),
    true
  );
  assert.equal(verifyEvidenceSignature(envelope, "wrong-signing-key-with-32-bytes-minimum"), false);
});
