import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_DIFF_CHARS = 120_000;
const MAX_FILES = 200;
const SECRET_PATTERNS = [
  [
    /-----BEGIN ([A-Z ]*PRIVATE KEY)-----[\s\S]*?-----END \1-----/g,
    "[REDACTED:private-key]"
  ],
  [/\bgh[opsu]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED:github-token]"],
  [/\bAIza[0-9A-Za-z_-]{30,}\b/g, "[REDACTED:google-api-key]"],
  [/\bpat[A-Za-z0-9]{14}\.[A-Za-z0-9]{32,}\b/g, "[REDACTED:airtable-token]"],
  [/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "[REDACTED:aws-access-key]"],
  [/\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}\b/g, "[REDACTED:stripe-key]"],
  [
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    "[REDACTED:jwt]"
  ],
  [
    /\b(password|secret|token|api[_-]?key)\s*[:=]\s*(?!\[REDACTED:)[^\s,;]+/gi,
    "[REDACTED:generic-secret]"
  ],
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

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) {
    throw new Error(`GitHub API failed: ${response.status}`);
  }
  return response.json();
}

async function listPullRequestFiles(apiUrl, repository, pullNumber, token) {
  const files = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await githubJson(
      `${apiUrl}/repos/${repository}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
      token
    );
    if (!Array.isArray(batch)) {
      throw new Error("GitHub files response was invalid");
    }
    files.push(...batch);
    if (batch.length < 100) break;
    if (page === 10) {
      throw new Error("Pull request file listing exceeded the review boundary");
    }
  }
  return files;
}

export async function prepareDiff({
  event,
  token,
  apiUrl,
  runId,
  ignoreContent
}) {
  const pull = event.pull_request;
  if (!pull || event.action === undefined) {
    throw new Error("Expected a pull_request event payload");
  }

  const matchers = parseIgnoreFile(ignoreContent);
  const rawFiles = await listPullRequestFiles(apiUrl, event.repository.full_name, pull.number, token);
  const reviewable = rawFiles
    .filter((file) => typeof file.filename === "string" && typeof file.patch === "string")
    .filter((file) => !isIgnored(file.filename, matchers));

  if (reviewable.length === 0) {
    throw new Error("No reviewable text diff remained after .aiignore filtering");
  }
  if (reviewable.length > MAX_FILES) {
    throw new Error(`Review input exceeds the ${MAX_FILES}-file boundary`);
  }

  const joined = reviewable
    .map((file) => `### ${file.filename}\n${file.patch}`)
    .join("\n\n");
  if (joined.length > MAX_DIFF_CHARS) {
    throw new Error(`Review input exceeds the ${MAX_DIFF_CHARS}-character boundary`);
  }
  const sanitized = redact(joined);

  return {
    schemaVersion: "1.0",
    requestId: randomUUID(),
    repository: {
      fullName: event.repository.full_name,
      id: String(event.repository.id),
      ownerId: String(event.repository.owner.id)
    },
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
    },
    diff: {
      sha256: createHash("sha256").update(sanitized.content).digest("hex"),
      content: sanitized.content,
      files: reviewable.map((file) => ({
        path: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions
      }))
    },
    preparation: {
      ignoredFileCount: rawFiles.length - reviewable.length,
      includedFileCount: reviewable.length,
      redactionCount: sanitized.redactions,
      truncated: false
    }
  };
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";
  const runId = process.env.GITHUB_RUN_ID;
  const outputPath = process.env.AI_REVIEW_OUTPUT ?? "ai-pre-review-input/review-input.json";

  if (!eventPath || !token || !runId) {
    throw new Error("Required GitHub Actions environment was missing");
  }

  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const ignorePath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.aiignore");
  const result = await prepareDiff({
    event,
    token,
    apiUrl,
    runId,
    ignoreContent: await readFile(ignorePath, "utf8")
  });

  await writeFile(outputPath, JSON.stringify(result, null, 2), { encoding: "utf8" });
  console.log(
    JSON.stringify({
      event: "ai_pre_review_prepared",
      requestId: result.requestId,
      fork: result.source.fork,
      includedFiles: result.preparation.includedFileCount,
      redactions: result.preparation.redactionCount,
      truncated: result.preparation.truncated
    })
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
