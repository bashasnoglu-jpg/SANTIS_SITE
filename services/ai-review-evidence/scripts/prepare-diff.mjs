import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MAX_DIFF_CHARS = 120_000;
export const MAX_FILES = 200;
export const MAX_PARTS = 10;
export const PREPARER_OUTPUT_CONTRACT = "multipart-directory-v2";

const SECRET_PATTERNS = [
  [/-----BEGIN ([A-Z ]*PRIVATE KEY)-----[\s\S]*?-----END \1-----/g, "[REDACTED:private-key]"],
  [/\bgh[opsu]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED:github-token]"],
  [/\bAIza[0-9A-Za-z_-]{30,}\b/g, "[REDACTED:google-api-key]"],
  [/\bpat[A-Za-z0-9]{14}\.[A-Za-z0-9]{32,}\b/g, "[REDACTED:airtable-token]"],
  [/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED:aws-access-key]"],
  [/\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}\b/g, "[REDACTED:stripe-key]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED:jwt]"],
  [/\b(password|secret|token|api[_-]?key)\s*[:=]\s*(?!\[REDACTED:)[^\s,;]+/gi, "[REDACTED:generic-secret]"],
  [/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "[REDACTED:bearer-token]"]
];

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

export function globToRegex(glob) {
  let pattern = escapeRegex(glob.trim().replaceAll("\\", "/"));
  pattern = pattern.replaceAll("**", "__DOUBLE_STAR__");
  pattern = pattern.replaceAll("*", "[^/]*");
  pattern = pattern.replaceAll("__DOUBLE_STAR__", ".*");
  return new RegExp(`^${pattern}$`, "i");
}

export function parseIgnoreFile(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map(globToRegex);
}

export function isIgnored(path, matchers) {
  const normalized = path.replaceAll("\\", "/");
  return matchers.some((matcher) => matcher.test(normalized));
}

export function redact(input) {
  let content = input;
  let redactions = 0;
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    content = content.replace(pattern, () => {
      redactions += 1;
      return replacement;
    });
  }
  return { content, redactions };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`GitHub API failed: ${response.status}`);
  return response.json();
}

async function listPullRequestFiles(apiUrl, repository, pullNumber, token) {
  const files = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await githubJson(
      `${apiUrl}/repos/${repository}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
      token
    );
    if (!Array.isArray(batch)) throw new Error("GitHub files response was invalid");
    files.push(...batch);
    if (batch.length < 100) break;
    if (page === 10) throw new Error("Pull request file listing exceeded the review boundary");
  }
  return files;
}

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function fileMetadata(file) {
  return {
    path: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions
  };
}

function deterministicCoverageShape({ repository, pullRequest, source, policy, coverage, parts }) {
  return {
    schemaVersion: "2.0",
    repository,
    pullRequest,
    source,
    policy,
    coverage: {
      reviewableFileCount: coverage.reviewableFileCount,
      ignoredFileCount: coverage.ignoredFileCount,
      sanitizedCharCount: coverage.sanitizedCharCount,
      redactionCount: coverage.redactionCount,
      fullDiffSha256: coverage.fullDiffSha256
    },
    parts: parts.map(({ index, path, charCount, diffSha256, fileCount }) => ({
      index,
      path,
      charCount,
      diffSha256,
      fileCount
    }))
  };
}

function validSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
}

function requiredSha(value, label) {
  if (!validSha(value)) throw new Error(`${label} must be a 40-character Git SHA`);
  return value.toLowerCase();
}

function requiredPositiveInteger(value, label) {
  const text = String(value ?? "");
  if (!/^[1-9][0-9]*$/.test(text)) throw new Error(`${label} must be a positive integer`);
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label} must be a safe integer`);
  return parsed;
}

function repositoryContext(event) {
  const repository = event?.repository;
  if (!repository?.full_name || !Number.isInteger(repository?.id) || !Number.isInteger(repository?.owner?.id)) {
    throw new Error("Expected repository metadata in GitHub event payload");
  }
  return {
    fullName: repository.full_name,
    id: String(repository.id),
    ownerId: String(repository.owner.id)
  };
}

export async function resolveReviewContext({ event, token, apiUrl, runId, eventMode = "pull_request", manualContext }) {
  const repository = repositoryContext(event);

  if (eventMode === "pull_request") {
    const pull = event.pull_request;
    if (!pull || event.action === undefined) throw new Error("Expected a pull_request event payload");
    return {
      repository,
      pullRequest: {
        number: pull.number,
        baseSha: pull.base.sha,
        headSha: pull.head.sha,
        headRepositoryId: String(pull.head.repo.id)
      },
      source: {
        eventName: "pull_request",
        workflowRunId: String(runId),
        fork: pull.head.repo.id !== event.repository.id
      }
    };
  }

  if (eventMode !== "workflow_dispatch") {
    throw new Error("Unsupported AI review event mode");
  }

  const prNumber = requiredPositiveInteger(manualContext?.prNumber, "Manual PR number");
  const expectedBaseSha = requiredSha(manualContext?.expectedBaseSha, "Expected PR base SHA");
  const expectedHeadSha = requiredSha(manualContext?.expectedHeadSha, "Expected PR head SHA");
  const trustedBaseSha = requiredSha(manualContext?.trustedBaseSha, "Trusted base SHA");

  const pull = await githubJson(
    `${apiUrl}/repos/${event.repository.full_name}/pulls/${prNumber}`,
    token
  );
  if (pull?.number !== prNumber) throw new Error("Resolved pull request number mismatch");
  if (pull?.state !== "open") throw new Error("Manual preparation requires an open pull request");
  if (pull?.base?.ref !== "develop") throw new Error("Manual preparation requires develop as PR base");
  if (pull?.head?.repo?.id !== event.repository.id) throw new Error("Manual preparation rejects forked pull requests");
  if (pull?.base?.sha !== expectedBaseSha) throw new Error("Resolved PR base SHA changed during manual preparation");
  if (pull?.head?.sha !== expectedHeadSha) throw new Error("Resolved PR head SHA changed during manual preparation");

  return {
    repository,
    pullRequest: {
      number: prNumber,
      baseSha: expectedBaseSha,
      headSha: expectedHeadSha,
      headRepositoryId: String(pull.head.repo.id)
    },
    source: {
      eventName: "workflow_dispatch",
      workflowRunId: String(runId),
      fork: false,
      trustedBaseSha
    }
  };
}

export async function prepareReviewPackage({
  event,
  token,
  apiUrl,
  runId,
  ignoreContent,
  eventMode = "pull_request",
  manualContext
}) {
  const context = await resolveReviewContext({ event, token, apiUrl, runId, eventMode, manualContext });
  const { repository, pullRequest, source } = context;

  const matchers = parseIgnoreFile(ignoreContent);
  const rawFiles = await listPullRequestFiles(apiUrl, event.repository.full_name, pullRequest.number, token);
  const reviewable = rawFiles
    .filter((file) => typeof file.filename === "string" && typeof file.patch === "string")
    .filter((file) => !isIgnored(file.filename, matchers))
    .sort((left, right) => comparePaths(left.filename, right.filename));

  if (reviewable.length === 0) throw new Error("No reviewable text diff remained after .aiignore filtering");
  if (reviewable.length > MAX_FILES) throw new Error(`Review input exceeds the ${MAX_FILES}-file boundary`);

  const entries = reviewable.map((file) => {
    const filenameCheck = redact(file.filename);
    if (filenameCheck.redactions > 0) {
      throw new Error("Review filename matched a secret pattern");
    }
    const sanitized = redact(`### ${file.filename}\n${file.patch}`);
    if (sanitized.content.length > MAX_DIFF_CHARS) {
      throw new Error(`Review file exceeds the ${MAX_DIFF_CHARS}-character per-part boundary`);
    }
    return { file, content: sanitized.content, redactions: sanitized.redactions };
  });

  const groups = [];
  let current = [];
  let currentChars = 0;
  for (const entry of entries) {
    const separatorChars = current.length === 0 ? 0 : 2;
    if (current.length > 0 && currentChars + separatorChars + entry.content.length > MAX_DIFF_CHARS) {
      groups.push(current);
      current = [];
      currentChars = 0;
    }
    currentChars += (current.length === 0 ? 0 : 2) + entry.content.length;
    current.push(entry);
  }
  if (current.length > 0) groups.push(current);
  if (groups.length > MAX_PARTS) throw new Error(`Review package exceeds the ${MAX_PARTS}-part boundary`);

  const policy = {
    maxPartChars: MAX_DIFF_CHARS,
    maxFiles: MAX_FILES,
    maxParts: MAX_PARTS,
    partition: "DETERMINISTIC_WHOLE_FILE",
    truncated: false
  };
  const ignoredFileCount = rawFiles.length - reviewable.length;

  const parts = groups.map((group, offset) => {
    const index = offset + 1;
    const content = group.map((entry) => entry.content).join("\n\n");
    return {
      schemaVersion: "1.0",
      requestId: randomUUID(),
      repository,
      pullRequest,
      source,
      diff: {
        sha256: sha256(content),
        content,
        files: group.map(({ file }) => fileMetadata(file))
      },
      preparation: {
        ignoredFileCount,
        includedFileCount: group.length,
        redactionCount: group.reduce((sum, entry) => sum + entry.redactions, 0),
        truncated: false
      },
      package: { index, totalParts: groups.length }
    };
  });

  const fullContent = entries.map((entry) => entry.content).join("\n\n");
  const descriptors = parts.map((part, offset) => ({
    index: offset + 1,
    path: `parts/review-input-${String(offset + 1).padStart(4, "0")}.json`,
    requestId: part.requestId,
    charCount: part.diff.content.length,
    diffSha256: part.diff.sha256,
    fileCount: part.diff.files.length
  }));
  const coverage = {
    reviewableFileCount: reviewable.length,
    ignoredFileCount,
    sanitizedCharCount: fullContent.length,
    redactionCount: parts.reduce((sum, part) => sum + part.preparation.redactionCount, 0),
    fullDiffSha256: sha256(fullContent)
  };
  const manifestBase = {
    schemaVersion: "2.0",
    packageId: randomUUID(),
    repository,
    pullRequest,
    source,
    policy,
    coverage,
    parts: descriptors
  };
  const coverageSha256 = sha256(canonicalJson(deterministicCoverageShape(manifestBase)));
  const manifest = {
    ...manifestBase,
    coverage: { ...coverage, coverageSha256 }
  };

  return { manifest, parts };
}

export async function prepareDiff(args) {
  const prepared = await prepareReviewPackage(args);
  if (prepared.parts.length !== 1) {
    throw new Error("prepareDiff compatibility API requires a single review part");
  }
  return prepared.parts[0];
}

export async function writeReviewPackage(outputDirectory, prepared) {
  const partsDirectory = resolve(outputDirectory, "parts");
  await mkdir(partsDirectory, { recursive: true });
  await writeFile(
    resolve(outputDirectory, "review-manifest.json"),
    JSON.stringify(prepared.manifest, null, 2),
    "utf8"
  );
  for (let offset = 0; offset < prepared.parts.length; offset += 1) {
    const path = resolve(partsDirectory, `review-input-${String(offset + 1).padStart(4, "0")}.json`);
    await writeFile(path, JSON.stringify(prepared.parts[offset], null, 2), "utf8");
  }
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";
  const runId = process.env.GITHUB_RUN_ID;
  const outputDirectory = process.env.AI_REVIEW_OUTPUT ?? "ai-pre-review-input";
  const eventMode = process.env.AI_REVIEW_EVENT_MODE ?? "pull_request";
  if (!eventPath || !token || !runId) throw new Error("Required GitHub Actions environment was missing");

  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const ignorePath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.aiignore");
  const manualContext = eventMode === "workflow_dispatch" ? {
    prNumber: process.env.AI_REVIEW_PR_NUMBER,
    expectedBaseSha: process.env.AI_REVIEW_EXPECTED_PR_BASE_SHA,
    expectedHeadSha: process.env.AI_REVIEW_EXPECTED_HEAD_SHA,
    trustedBaseSha: process.env.AI_REVIEW_TRUSTED_BASE_SHA
  } : undefined;
  const prepared = await prepareReviewPackage({
    event,
    token,
    apiUrl,
    runId,
    ignoreContent: await readFile(ignorePath, "utf8"),
    eventMode,
    manualContext
  });
  await writeReviewPackage(outputDirectory, prepared);

  console.log(JSON.stringify({
    event: "ai_pre_review_package_prepared",
    sourceEventName: prepared.manifest.source.eventName,
    trustedBaseSha: prepared.manifest.source.trustedBaseSha ?? null,
    packageId: prepared.manifest.packageId,
    fork: prepared.manifest.source.fork,
    includedFiles: prepared.manifest.coverage.reviewableFileCount,
    ignoredFiles: prepared.manifest.coverage.ignoredFileCount,
    sanitizedChars: prepared.manifest.coverage.sanitizedCharCount,
    parts: prepared.manifest.parts.length,
    partChars: prepared.manifest.parts.map((part) => part.charCount),
    redactions: prepared.manifest.coverage.redactionCount,
    coverageSha256: prepared.manifest.coverage.coverageSha256,
    truncated: false
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
