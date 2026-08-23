import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LEGACY_DURATION_DENY_LIST = [
  "Service Duration Auto",
];

export const LEGACY_DURATION_BASELINE_ALLOWLIST = new Set([
  // Intentionally empty in-repository baseline for Phase 5C-D1.
  // Existing Live/Archive Airtable formulas are external runtime baseline and are not mutated here.
]);

export const LEGACY_DURATION_DEPENDENCY_FORBIDDEN =
  "LEGACY_DURATION_DEPENDENCY_FORBIDDEN";

const SELF_EXCLUDED_PATHS = new Set([
  "scripts/active/audit-legacy-duration-dependency-freeze.mjs",
  "scripts/active/audit-legacy-duration-dependency-freeze.test.mjs",
]);

const SCANNED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
]);

function normalizeRepositoryPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function lineNumberForOffset(content, offset) {
  return content.slice(0, offset).split("\n").length;
}

export function findForbiddenLegacyDurationReferences(
  files,
  { baselineAllowlist = LEGACY_DURATION_BASELINE_ALLOWLIST } = {},
) {
  const violations = [];

  for (const file of files) {
    const repositoryPath = normalizeRepositoryPath(file.path);

    if (SELF_EXCLUDED_PATHS.has(repositoryPath)) continue;
    if (baselineAllowlist.has(repositoryPath)) continue;
    if (!SCANNED_EXTENSIONS.has(path.extname(repositoryPath))) continue;

    for (const deniedReference of LEGACY_DURATION_DENY_LIST) {
      let offset = file.content.indexOf(deniedReference);

      while (offset !== -1) {
        violations.push({
          code: LEGACY_DURATION_DEPENDENCY_FORBIDDEN,
          path: repositoryPath,
          line: lineNumberForOffset(file.content, offset),
          reference: deniedReference,
        });
        offset = file.content.indexOf(deniedReference, offset + deniedReference.length);
      }
    }
  }

  return violations;
}

function listTrackedCandidateFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map(normalizeRepositoryPath)
    .filter((filePath) => SCANNED_EXTENSIONS.has(path.extname(filePath)));
}

export function auditRepository() {
  const files = listTrackedCandidateFiles().map((filePath) => ({
    path: filePath,
    content: readFileSync(filePath, "utf8"),
  }));

  return findForbiddenLegacyDurationReferences(files);
}

function main() {
  const violations = auditRepository();

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(
        `${violation.code}: ${violation.path}:${violation.line} references ${JSON.stringify(violation.reference)}`,
      );
    }
    process.exit(1);
  }

  console.log(
    "✅ Legacy duration dependency freeze passed: no forbidden repository dependency was found.",
  );
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (entryFile === currentFile) {
  main();
}
