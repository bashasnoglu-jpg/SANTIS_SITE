import { createHash } from "node:crypto";
import { appendFile, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { canonicalJson, MAX_DIFF_CHARS, MAX_FILES, MAX_PARTS } from "./prepare-diff.mjs";

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(message) {
  throw new Error(`AI review package preflight failed: ${message}`);
}

function deterministicCoverageShape(manifest) {
  return {
    schemaVersion: "2.0",
    repository: manifest.repository,
    pullRequest: manifest.pullRequest,
    source: manifest.source,
    policy: manifest.policy,
    coverage: {
      reviewableFileCount: manifest.coverage.reviewableFileCount,
      ignoredFileCount: manifest.coverage.ignoredFileCount,
      sanitizedCharCount: manifest.coverage.sanitizedCharCount,
      redactionCount: manifest.coverage.redactionCount,
      fullDiffSha256: manifest.coverage.fullDiffSha256
    },
    parts: manifest.parts.map(({ index, path, charCount, diffSha256, fileCount }) => ({
      index,
      path,
      charCount,
      diffSha256,
      fileCount
    }))
  };
}

function expectedBinding() {
  const sourceEventName = process.env.EXPECTED_SOURCE_EVENT_NAME ?? "pull_request";
  if (!['pull_request', 'workflow_dispatch'].includes(sourceEventName)) {
    throw new Error("EXPECTED_SOURCE_EVENT_NAME is unsupported");
  }
  const expected = {
    repositoryId: requiredEnvironment("EXPECTED_REPOSITORY_ID"),
    ownerId: requiredEnvironment("EXPECTED_OWNER_ID"),
    workflowRunId: requiredEnvironment("EXPECTED_WORKFLOW_RUN_ID"),
    pullRequestNumber: Number(requiredEnvironment("EXPECTED_PULL_REQUEST_NUMBER")),
    baseSha: requiredEnvironment("EXPECTED_BASE_SHA"),
    headSha: requiredEnvironment("EXPECTED_HEAD_SHA"),
    sourceEventName
  };
  if (sourceEventName === "workflow_dispatch") {
    expected.trustedBaseSha = requiredEnvironment("EXPECTED_TRUSTED_BASE_SHA");
  }
  return expected;
}

function validateSource(source, expected, label = "source") {
  if (source?.eventName !== expected.sourceEventName) fail(`${label} event mismatch`);
  if (source?.workflowRunId !== expected.workflowRunId) fail(`${label} workflow run mismatch`);
  if (source?.fork !== false) fail(`${label} fork boundary mismatch`);
  if (expected.sourceEventName === "workflow_dispatch") {
    if (!isSha(source?.trustedBaseSha)) fail(`${label} trusted base SHA missing or invalid`);
    if (source.trustedBaseSha !== expected.trustedBaseSha) fail(`${label} trusted base SHA mismatch`);
  }
}

export async function validateReviewPackage(manifestPath, expected = expectedBinding()) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const root = dirname(manifestPath);
  const partsDirectory = resolve(root, "parts");

  if (!['pull_request', 'workflow_dispatch'].includes(expected?.sourceEventName ?? 'pull_request')) {
    fail("unsupported expected source event");
  }
  const normalizedExpected = {
    ...expected,
    sourceEventName: expected?.sourceEventName ?? "pull_request"
  };
  if (normalizedExpected.sourceEventName === "workflow_dispatch" && !isSha(normalizedExpected.trustedBaseSha)) {
    fail("expected trusted base SHA missing or invalid");
  }

  if (manifest?.schemaVersion !== "2.0") fail("manifest schema version mismatch");
  if (!isUuid(manifest?.packageId)) fail("package ID mismatch");
  if (manifest?.repository?.id !== normalizedExpected.repositoryId) fail("repository ID mismatch");
  if (manifest?.repository?.ownerId !== normalizedExpected.ownerId) fail("owner ID mismatch");
  if (manifest?.pullRequest?.number !== normalizedExpected.pullRequestNumber) fail("PR number mismatch");
  if (manifest?.pullRequest?.baseSha !== normalizedExpected.baseSha) fail("base SHA mismatch");
  if (manifest?.pullRequest?.headSha !== normalizedExpected.headSha) fail("head SHA mismatch");
  if (manifest?.pullRequest?.headRepositoryId !== normalizedExpected.repositoryId) fail("head repository mismatch");
  validateSource(manifest?.source, normalizedExpected);

  const policy = manifest?.policy;
  if (policy?.maxPartChars !== MAX_DIFF_CHARS) fail("per-part character boundary mismatch");
  if (policy?.maxFiles !== MAX_FILES) fail("file boundary mismatch");
  if (policy?.maxParts !== MAX_PARTS) fail("part boundary mismatch");
  if (policy?.partition !== "DETERMINISTIC_WHOLE_FILE") fail("partition policy mismatch");
  if (policy?.truncated !== false) fail("truncation is forbidden");

  if (!Array.isArray(manifest?.parts) || manifest.parts.length === 0) fail("manifest parts missing");
  if (manifest.parts.length > MAX_PARTS) fail("manifest exceeds part boundary");
  if (!Number.isInteger(manifest?.coverage?.reviewableFileCount) || manifest.coverage.reviewableFileCount < 1) {
    fail("reviewable file count mismatch");
  }
  if (manifest.coverage.reviewableFileCount > MAX_FILES) fail("reviewable file count exceeds boundary");
  if (!Number.isInteger(manifest?.coverage?.ignoredFileCount) || manifest.coverage.ignoredFileCount < 0) {
    fail("ignored file count mismatch");
  }

  const diskEntries = (await readdir(partsDirectory)).sort();
  const expectedDiskEntries = manifest.parts
    .map((descriptor) => descriptor.path.replace(/^parts\//, ""))
    .sort();
  if (JSON.stringify(diskEntries) !== JSON.stringify(expectedDiskEntries)) {
    fail("missing or unmanifested part file");
  }

  const requestIds = new Set();
  const allFilePaths = [];
  const parts = [];
  let totalRedactions = 0;

  for (let offset = 0; offset < manifest.parts.length; offset += 1) {
    const descriptor = manifest.parts[offset];
    const index = offset + 1;
    const expectedPath = `parts/review-input-${String(index).padStart(4, "0")}.json`;
    if (descriptor?.index !== index) fail("part index sequence mismatch");
    if (descriptor?.path !== expectedPath) fail("part path mismatch");
    if (!isUuid(descriptor?.requestId) || requestIds.has(descriptor.requestId)) {
      fail("duplicate or invalid part request ID");
    }
    requestIds.add(descriptor.requestId);

    const part = JSON.parse(await readFile(resolve(root, descriptor.path), "utf8"));
    parts.push(part);
    const content = part?.diff?.content;
    if (part?.schemaVersion !== "1.0") fail("part schema mismatch");
    if (part?.requestId !== descriptor.requestId) fail("part request ID mismatch");
    if (part?.repository?.id !== normalizedExpected.repositoryId || part?.repository?.ownerId !== normalizedExpected.ownerId) {
      fail("part repository binding mismatch");
    }
    if (part?.pullRequest?.number !== normalizedExpected.pullRequestNumber || part?.pullRequest?.baseSha !== normalizedExpected.baseSha ||
        part?.pullRequest?.headSha !== normalizedExpected.headSha || part?.pullRequest?.headRepositoryId !== normalizedExpected.repositoryId) {
      fail("part PR binding mismatch");
    }
    validateSource(part?.source, normalizedExpected, "part source");
    if (part?.package?.index !== index || part?.package?.totalParts !== manifest.parts.length) {
      fail("part package index mismatch");
    }
    if (part?.preparation?.truncated !== false) fail("truncated part rejected");
    if (!Array.isArray(part?.diff?.files) || part.diff.files.length === 0) fail("part file list missing");
    if (part?.preparation?.includedFileCount !== part.diff.files.length) fail("included file count mismatch");
    if (part?.preparation?.ignoredFileCount !== manifest.coverage.ignoredFileCount) fail("ignored file count mismatch");
    if (!Number.isInteger(part?.preparation?.redactionCount) || part.preparation.redactionCount < 0) {
      fail("redaction count mismatch");
    }
    if (typeof content !== "string" || content.length === 0 || content.length > MAX_DIFF_CHARS) {
      fail("part content boundary mismatch");
    }
    const digest = sha256(content);
    if (part?.diff?.sha256 !== digest || descriptor?.diffSha256 !== digest) fail("part digest mismatch");
    if (descriptor?.charCount !== content.length) fail("part character count mismatch");
    if (descriptor?.fileCount !== part.diff.files.length) fail("part file count mismatch");

    for (const file of part.diff.files) {
      if (typeof file?.path !== "string" || file.path.length === 0) fail("part file path missing");
      if (typeof file?.status !== "string" || file.status.length === 0) fail("part file status missing");
      if (!Number.isInteger(file?.additions) || file.additions < 0 ||
          !Number.isInteger(file?.deletions) || file.deletions < 0) {
        fail("part file change counts invalid");
      }
      if (allFilePaths.includes(file.path)) fail("duplicate file across parts");
      allFilePaths.push(file.path);
    }
    totalRedactions += part.preparation.redactionCount;
  }

  const sortedPaths = [...allFilePaths].sort(comparePaths);
  if (JSON.stringify(allFilePaths) !== JSON.stringify(sortedPaths)) fail("file ordering is not deterministic");
  if (allFilePaths.length !== manifest.coverage.reviewableFileCount) fail("full file coverage mismatch");
  if (totalRedactions !== manifest.coverage.redactionCount) fail("full redaction count mismatch");

  const fullContent = parts.map((part) => part.diff.content).join("\n\n");
  if (fullContent.length !== manifest.coverage.sanitizedCharCount) fail("sanitized character count mismatch");
  if (sha256(fullContent) !== manifest.coverage.fullDiffSha256) fail("full diff digest mismatch");
  const coverageDigest = sha256(canonicalJson(deterministicCoverageShape(manifest)));
  if (coverageDigest !== manifest.coverage.coverageSha256) fail("coverage digest mismatch");

  return { eligible: true, manifest, parts };
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) throw new Error("Manifest path is required");
  let eligible = false;
  try {
    await validateReviewPackage(manifestPath);
    eligible = true;
  } catch (error) {
    console.log("Evaluation denied: artifact provenance or review boundary mismatch.");
    if (process.env.FAIL_ON_INELIGIBLE === "true") throw error;
  }
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `eligible=${eligible}\n`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
