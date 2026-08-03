import { readFile } from "node:fs/promises";

function isSha(value, length) {
  return typeof value === "string" && new RegExp(`^[a-f0-9]{${length}}$`, "i").test(value);
}

function fail(message) {
  throw new Error(`Evidence response validation failed: ${message}`);
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function main() {
  const [inputPath, evidencePath] = process.argv.slice(2);
  if (!inputPath || !evidencePath) fail("input and evidence paths are required");

  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const envelope = JSON.parse(await readFile(evidencePath, "utf8"));
  const evidence = envelope?.evidence;
  const provenance = evidence?.content_provenance;

  if (evidence?.schema_version !== "1.0") fail("schema version mismatch");
  if (!isUuid(evidence?.evidence_id)) fail("evidence ID mismatch");
  if (evidence?.request_id !== input?.requestId) fail("request ID mismatch");
  if (typeof evidence?.generated_at !== "string" || Number.isNaN(Date.parse(evidence.generated_at))) {
    fail("generated timestamp mismatch");
  }
  if (evidence?.mode !== "shadow") fail("mode must be shadow");
  if (evidence?.binding_status !== "NON_BINDING") fail("binding status mismatch");
  if (evidence?.human_review_status !== "NOT_EVALUATED") fail("human review status mismatch");
  if (
    evidence?.ai_disclosure !==
    "AI-generated pre-review evidence. A human reviewer must independently verify every finding."
  ) fail("AI disclosure mismatch");
  if (provenance?.provider !== "google-vertex-ai") fail("provider mismatch");
  if (typeof provenance?.model !== "string" || provenance.model.length === 0) fail("model mismatch");
  if (typeof provenance?.region !== "string" || provenance.region.length === 0) fail("region mismatch");
  if (provenance?.repository_id !== input?.repository?.id) fail("repository mismatch");
  if (provenance?.pull_request_number !== input?.pullRequest?.number) fail("PR mismatch");
  if (provenance?.base_sha !== input?.pullRequest?.baseSha) fail("base SHA mismatch");
  if (provenance?.head_sha !== input?.pullRequest?.headSha) fail("head SHA mismatch");
  if (provenance?.diff_sha256 !== input?.diff?.sha256) fail("diff digest mismatch");
  if (typeof evidence?.review?.summary !== "string" || evidence.review.summary.length === 0) {
    fail("summary mismatch");
  }
  if (!Array.isArray(evidence?.review?.findings)) fail("findings must be an array");
  if (evidence.review.findings.length > 50) fail("too many findings");
  if (!Array.isArray(evidence?.review?.limitations)) fail("limitations must be an array");
  if (envelope?.signature?.algorithm !== "HMAC-SHA256") fail("signature algorithm mismatch");
  if (!isSha(envelope?.signature?.value, 64)) fail("signature shape mismatch");

  console.log("Signed non-binding evidence response contract: PASS");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
