import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  MAX_DIFF_CHARS,
  MAX_PARTS,
  globToRegex,
  isIgnored,
  parseIgnoreFile,
  prepareReviewPackage,
  redact,
  writeReviewPackage
} from "../scripts/prepare-diff.mjs";

const repository = {
  id: 1146035054,
  full_name: "bashasnoglu-jpg/SANTIS_SITE",
  owner: { id: 241850015 }
};

function eventFixture(action = "opened") {
  return {
    action,
    repository,
    pull_request: {
      number: 382,
      base: { sha: "a".repeat(40) },
      head: { sha: "b".repeat(40), repo: { id: 1146035054 } }
    }
  };
}

async function withFiles(files, callback) {
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
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function file(filename, patch, additions = 1, deletions = 0, status = "modified") {
  return { filename, patch, status, additions, deletions };
}

async function prepare(files, ignoreContent = "") {
  return withFiles(files, () => prepareReviewPackage({
    event: eventFixture(),
    token: "synthetic-token-not-a-credential",
    apiUrl: "https://api.github.test",
    runId: "123456",
    ignoreContent
  }));
}

test("AR-SEC-001 aiignore glob conversion handles nested secret files", () => {
  const matchers = parseIgnoreFile("**/.env*\n**/*.pem\nnode_modules/**\n");
  assert.equal(isIgnored("apps/api/.env.production", matchers), true);
  assert.equal(isIgnored("certs/runtime.pem", matchers), true);
  assert.equal(isIgnored("node_modules/zod/index.js", matchers), true);
  assert.equal(isIgnored("src/review.ts", matchers), false);
});

test("AR-SEC-002 glob regex remains anchored", () => {
  assert.equal(globToRegex("*.key").test("secret.key"), true);
  assert.equal(globToRegex("*.key").test("nested/secret.key"), false);
});

test("AR-SEC-003 preparer removes GitHub tokens", () => {
  const canary = "ghp_abcdefghijklmnopqrstuvwxyz123456";
  const result = redact(`+ token=${canary}`);
  assert.equal(result.redactions, 1);
  assert.doesNotMatch(result.content, /ghp_/);
  assert.equal(result.content.includes(canary), false);
});

test("AR-SEC-004 preparer removes the complete private key body", () => {
  const result = redact("-----BEGIN PRIVATE KEY-----\nsensitive-body\n-----END PRIVATE KEY-----");
  assert.equal(result.redactions, 1);
  assert.equal(result.content, "[REDACTED:private-key]");
});



test("AR-SEC-005 serialized review package contains no synthetic credential or ignored secret canaries", async () => {
  const tokenCanary = "ghp_abcdefghijklmnopqrstuvwxyz123456";
  const privateKeyCanary = "-----BEGIN PRIVATE KEY-----\nsynthetic-private-body\n-----END PRIVATE KEY-----";
  const ignoredCanary = "PASSWORD=synthetic-ignored-secret";
  const output = await prepare([
    file("src/security.ts", `+token=${tokenCanary}\n+${privateKeyCanary}`),
    file(".env.production", `+${ignoredCanary}`)
  ], ".env*\n**/.env*\n");
  const serialized = JSON.stringify(output);
  assert.equal(serialized.includes(tokenCanary), false);
  assert.equal(serialized.includes("synthetic-private-body"), false);
  assert.equal(serialized.includes(ignoredCanary), false);
});

test("AR-SEC-006 secret-pattern filename is rejected before metadata serialization", async () => {
  await assert.rejects(
    prepare([file("src/ghp_abcdefghijklmnopqrstuvwxyz123456.ts", "+const safe = true;")]),
    /filename matched a secret pattern/
  );
});

test("AR-PREP-001 small diff produces one bounded part", async () => {
  const output = await prepare([
    file("src/review.ts", "@@ -0,0 +1 @@\n+const safe = true;"),
    file(".env.production", "@@ -0,0 +1 @@\n+PASSWORD=do-not-send")
  ], ".env*\n**/.env*\n");
  assert.equal(output.parts.length, 1);
  assert.equal(output.manifest.coverage.reviewableFileCount, 1);
  assert.equal(output.manifest.coverage.ignoredFileCount, 1);
  assert.equal(output.parts[0].preparation.truncated, false);
  assert.equal(output.parts[0].diff.content.includes("do-not-send"), false);
});

test("AR-PREP-002 exactly 120000 sanitized characters remains valid", async () => {
  const filename = "src/exact.ts";
  const header = `### ${filename}\n`;
  const patch = "x".repeat(MAX_DIFF_CHARS - header.length);
  const output = await prepare([file(filename, patch)]);
  assert.equal(output.parts.length, 1);
  assert.equal(output.parts[0].diff.content.length, MAX_DIFF_CHARS);
});

test("AR-PREP-003 aggregate above 120000 becomes deterministic multipart without truncation", async () => {
  const files = [
    file("src/a.ts", "a".repeat(70_000)),
    file("src/b.ts", "b".repeat(70_000)),
    file("src/c.ts", "c".repeat(10_000))
  ];
  const output = await prepare(files);
  assert.equal(output.parts.length, 2);
  assert.ok(output.parts.every((part) => part.diff.content.length <= MAX_DIFF_CHARS));
  assert.ok(output.parts.every((part) => part.preparation.truncated === false));
  assert.deepEqual(
    output.parts.flatMap((part) => part.diff.files.map((entry) => entry.path)),
    ["src/a.ts", "src/b.ts", "src/c.ts"]
  );
});

test("AR-PREP-004 single sanitized file above 120000 fails closed", async () => {
  await assert.rejects(
    prepare([file("src/oversized.ts", "x".repeat(MAX_DIFF_CHARS + 1))]),
    /per-part boundary/
  );
});

test("AR-PREP-005 more than 200 reviewable files fails closed", async () => {
  const files = Array.from({ length: 201 }, (_, index) =>
    file(`src/file-${String(index).padStart(3, "0")}.ts`, `+export const value${index} = true;`)
  );
  await assert.rejects(prepare(files), /200-file boundary/);
});

test("AR-PREP-006 package above 10 parts fails closed", async () => {
  const files = Array.from({ length: MAX_PARTS + 1 }, (_, index) =>
    file(`src/large-${String(index).padStart(2, "0")}.ts`, String(index % 10).repeat(70_000))
  );
  await assert.rejects(prepare(files), /10-part boundary/);
});

test("AR-PREP-007 repeated exact input has stable boundaries and coverage digest", async () => {
  const files = [
    file("src/z.ts", "z".repeat(65_000)),
    file("src/a.ts", "a".repeat(65_000)),
    file("src/m.ts", "m".repeat(5_000))
  ];
  const first = await prepare(files);
  const second = await prepare([...files].reverse());
  assert.deepEqual(
    first.manifest.parts.map(({ index, path, charCount, diffSha256, fileCount }) => ({ index, path, charCount, diffSha256, fileCount })),
    second.manifest.parts.map(({ index, path, charCount, diffSha256, fileCount }) => ({ index, path, charCount, diffSha256, fileCount }))
  );
  assert.equal(first.manifest.coverage.coverageSha256, second.manifest.coverage.coverageSha256);
  assert.equal(first.manifest.coverage.fullDiffSha256, second.manifest.coverage.fullDiffSha256);
});

test("AR-PREP-008 package writer emits manifest and every declared part", async () => {
  const output = await prepare([
    file("src/a.ts", "a".repeat(70_000)),
    file("src/b.ts", "b".repeat(70_000))
  ]);
  const directory = await mkdtemp(join(tmpdir(), "ai-review-package-"));
  await writeReviewPackage(directory, output);
  const manifest = JSON.parse(await readFile(join(directory, "review-manifest.json"), "utf8"));
  assert.equal(manifest.parts.length, 2);
  for (const descriptor of manifest.parts) {
    const part = JSON.parse(await readFile(join(directory, descriptor.path), "utf8"));
    assert.equal(part.requestId, descriptor.requestId);
    assert.equal(part.diff.sha256, descriptor.diffSha256);
  }
});
