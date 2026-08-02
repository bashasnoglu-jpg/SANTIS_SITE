import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const title = process.env.PR_TITLE ?? "";
const body = process.env.PR_BODY ?? "";
const actionPattern = /ACT-P[0-9]+-[A-Z0-9-]+/;
const googleDocPattern = /https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+/;

const failures = [];
const actionId = (title.match(actionPattern) ?? body.match(actionPattern))?.[0];

if (!actionId) failures.push("Missing Airtable Action ID in PR title/body.");
if (!googleDocPattern.test(body)) failures.push("Missing authoritative Google Docs URL in PR body.");

const baseSha = process.env.BASE_SHA;
const headSha = process.env.PR_HEAD_SHA;
if (!baseSha || !headSha) failures.push("Workflow did not receive base/head SHA.");

let changedFiles = [];
if (baseSha && headSha) {
  changedFiles = execFileSync("git", ["diff", "--name-only", baseSha, headSha], { encoding: "utf8" })
    .split("\n").filter(Boolean);
}

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bpat[A-Za-z0-9._-]{20,}\b/,
  /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"'\n]{8,}["']/i
];

for (const file of changedFiles) {
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  if (secretPatterns.some((pattern) => pattern.test(content))) {
    failures.push(`Potential secret/credential in changed file: ${file}`);
  }
}

const evidence = {
  action_id: actionId ?? null,
  normative_document_present: googleDocPattern.test(body),
  workflow_sha: process.env.GITHUB_SHA ?? null,
  verified_head_sha: headSha ?? null,
  base_sha: baseSha ?? null,
  run_url: process.env.RUN_URL ?? null,
  repository: process.env.GITHUB_REPOSITORY ?? null,
  environment: "CI",
  changed_files: changedFiles,
  pii_secret_scan: failures.some((x) => x.startsWith("Potential secret")) ? "FAIL" : "PASS",
  gate_decision: "NOT_EVALUATED",
  note: "CI result is technical evidence only and cannot pass an independent Airtable gate."
};

writeFileSync("traceability-evidence.json", JSON.stringify(evidence, null, 2) + "\n");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(JSON.stringify(evidence, null, 2));
