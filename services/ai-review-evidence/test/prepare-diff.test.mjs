import assert from "node:assert/strict";
import test from "node:test";
import {
  globToRegex,
  isIgnored,
  parseIgnoreFile,
  prepareDiff,
  redact
} from "../scripts/prepare-diff.mjs";

test("aiignore glob conversion handles nested secret files", () => {
  const matchers = parseIgnoreFile("**/.env*\n**/*.pem\nnode_modules/**\n");
  assert.equal(isIgnored("apps/api/.env.production", matchers), true);
  assert.equal(isIgnored("certs/runtime.pem", matchers), true);
  assert.equal(isIgnored("node_modules/zod/index.js", matchers), true);
  assert.equal(isIgnored("src/review.ts", matchers), false);
});

test("glob regex remains anchored", () => {
  assert.equal(globToRegex("*.key").test("secret.key"), true);
  assert.equal(globToRegex("*.key").test("nested/secret.key"), false);
});

test("preparer removes GitHub tokens", () => {
  const result = redact("+ token=ghp_abcdefghijklmnopqrstuvwxyz123456");
  assert.equal(result.redactions, 1);
  assert.doesNotMatch(result.content, /ghp_/);
});

test("preparer removes the complete private key body", () => {
  const result = redact(
    "-----BEGIN PRIVATE KEY-----\nsensitive-body\n-----END PRIVATE KEY-----"
  );
  assert.equal(result.redactions, 1);
  assert.equal(result.content, "[REDACTED:private-key]");
});

test("prepare flow filters ignored files and binds repository identity", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          filename: "src/review.ts",
          patch: "@@ -0,0 +1 @@\n+token=ghp_abcdefghijklmnopqrstuvwxyz123456",
          status: "added",
          additions: 1,
          deletions: 0
        },
        {
          filename: ".env.production",
          patch: "@@ -0,0 +1 @@\n+PASSWORD=do-not-send",
          status: "added",
          additions: 1,
          deletions: 0
        }
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  try {
    const output = await prepareDiff({
      event: {
        action: "opened",
        repository: {
          id: 1146035054,
          full_name: "bashasnoglu-jpg/SANTIS_SITE",
          owner: { id: 241850015 }
        },
        pull_request: {
          number: 371,
          base: { sha: "a".repeat(40) },
          head: { sha: "b".repeat(40), repo: { id: 1146035054 } }
        }
      },
      token: "test-token-not-a-credential",
      apiUrl: "https://api.github.test",
      runId: "123456",
      ignoreContent: ".env*\n**/.env*\n"
    });

    assert.equal(output.repository.id, "1146035054");
    assert.equal(output.repository.ownerId, "241850015");
    assert.equal(output.source.fork, false);
    assert.equal(output.preparation.includedFileCount, 1);
    assert.equal(output.preparation.ignoredFileCount, 1);
    assert.equal(output.preparation.redactionCount, 1);
    assert.doesNotMatch(output.diff.content, /ghp_|do-not-send/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
