import { constants, createHash, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import { SIGNATURE_ALGORITHM } from "../constants.mjs";

function fail(message) {
  throw new Error(`Evidence response validation failed: ${message}`);
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

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

async function main() {
  const [inputPath, evidencePath] = process.argv.slice(2);
  if (!inputPath || !evidencePath) fail("input and evidence paths are required");

  const publicKeyPem = process.env.EVIDENCE_KMS_PUBLIC_KEY_PEM;
  const expectedKeyVersion = process.env.EVIDENCE_KMS_KEY_VERSION;
  if (!publicKeyPem || !expectedKeyVersion) fail("trusted KMS verification configuration is required");

  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const envelope = JSON.parse(await readFile(evidencePath, "utf8"));
  const evidence = envelope?.evidence;
  const provenance = evidence?.content_provenance;

  if (evidence?.schema_version !== "1.0") fail("schema version mismatch");
  if (!isUuid(evidence?.evidence_id)) fail("evidence ID mismatch");
  if (evidence?.request_id !== input?.requestId) fail("request ID mismatch");
  if (typeof evidence?.generated_at !== "string" || Number.isNaN(Date.parse(evidence.generated_at))) fail("generated timestamp mismatch");
  if (evidence?.mode !== "shadow") fail("mode must be shadow");
  if (evidence?.binding_status !== "NON_BINDING") fail("binding status mismatch");
  if (evidence?.human_review_status !== "NOT_EVALUATED") fail("human review status mismatch");
  if (evidence?.ai_disclosure !== "AI-generated pre-review evidence. A human reviewer must independently verify every finding.") fail("AI disclosure mismatch");
  if (provenance?.provider !== "google-vertex-ai") fail("provider mismatch");
  if (typeof provenance?.model !== "string" || provenance.model.length === 0) fail("model mismatch");
  if (typeof provenance?.region !== "string" || provenance.region.length === 0) fail("region mismatch");
  if (provenance?.repository_id !== input?.repository?.id) fail("repository mismatch");
  if (provenance?.pull_request_number !== input?.pullRequest?.number) fail("PR mismatch");
  if (provenance?.base_sha !== input?.pullRequest?.baseSha) fail("base SHA mismatch");
  if (provenance?.head_sha !== input?.pullRequest?.headSha) fail("head SHA mismatch");
  if (provenance?.diff_sha256 !== input?.diff?.sha256) fail("diff digest mismatch");
  if (typeof evidence?.review?.summary !== "string" || evidence.review.summary.length === 0) fail("summary mismatch");
  if (!Array.isArray(evidence?.review?.findings) || evidence.review.findings.length > 50) fail("findings mismatch");
  if (!Array.isArray(evidence?.review?.limitations)) fail("limitations must be an array");
  if (envelope?.signature?.algorithm !== SIGNATURE_ALGORITHM) fail("signature algorithm mismatch");
  if (envelope?.signature?.key_version !== expectedKeyVersion) fail("KMS key version mismatch");
  if (typeof envelope?.signature?.value !== "string") fail("signature missing");

  const canonicalEvidence = Buffer.from(canonicalJson(evidence), "utf8");
  const valid = verify(
    "sha256",
    canonicalEvidence,
    { key: publicKeyPem, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST },
    Buffer.from(envelope.signature.value, "base64")
  );
  if (!valid) fail("cryptographic signature verification failed");

  console.log("Signed non-binding evidence response contract and KMS signature: PASS");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
