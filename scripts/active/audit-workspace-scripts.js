/**
 * SANTIS OS — Sovereign Workspace Auditor
 * Purpose: Ensures all active workspace units define mandatory architectural scripts.
 * Logic: Production-grade, zero-dependency, workspace-aware validation.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const WORKSPACE_FILE = path.join(ROOT_DIR, "pnpm-workspace.yaml");
const MANDATORY_SCRIPTS = ["build", "lint", "typecheck"];
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".turbo",
  ".next",
  "dist",
  "build",
  "coverage",
  "_archive",
  "archive",
]);

console.log("🛡️ [Sovereign Guard] Workspace script audit starting...");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`❌ Invalid JSON: ${path.relative(ROOT_DIR, filePath)}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function parseWorkspacePatterns() {
  if (!fs.existsSync(WORKSPACE_FILE)) {
    console.error("❌ pnpm-workspace.yaml not found. Workspace reality cannot be audited.");
    process.exit(1);
  }

  const lines = fs.readFileSync(WORKSPACE_FILE, "utf8").split(/\r?\n/);
  const patterns = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("-")) continue;

    const pattern = trimmed
      .slice(1)
      .trim()
      .replace(/^['\"]|['\"]$/g, "");

    if (pattern && !pattern.startsWith("!")) {
      patterns.push(pattern);
    }
  }

  if (patterns.length === 0) {
    console.error("❌ No workspace package patterns found in pnpm-workspace.yaml.");
    process.exit(1);
  }

  return patterns;
}

function listDirectories(baseDir) {
  if (!fs.existsSync(baseDir)) return [];

  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !IGNORE_DIRS.has(entry.name))
    .map((entry) => path.join(baseDir, entry.name));
}

function expandWorkspacePattern(pattern) {
  const normalized = pattern.replace(/\\/g, "/");

  if (normalized.endsWith("/*")) {
    const base = path.join(ROOT_DIR, normalized.slice(0, -2));
    return listDirectories(base);
  }

  const direct = path.join(ROOT_DIR, normalized);
  return fs.existsSync(direct) ? [direct] : [];
}

const workspaceDirs = [...new Set(parseWorkspacePatterns().flatMap(expandWorkspacePattern))]
  .sort((a, b) => a.localeCompare(b));

let failed = false;
let checked = 0;

for (const workspaceDir of workspaceDirs) {
  const pkgPath = path.join(workspaceDir, "package.json");
  const relativeDir = path.relative(ROOT_DIR, workspaceDir);

  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Workspace path has no package.json: ${relativeDir}`);
    failed = true;
    continue;
  }

  const pkg = readJson(pkgPath);
  const scripts = pkg.scripts || {};
  const missing = MANDATORY_SCRIPTS.filter((scriptName) => !scripts[scriptName]);
  checked += 1;

  if (missing.length > 0) {
    console.error(`❌ ${pkg.name || relativeDir} missing scripts: ${missing.join(", ")}`);
    failed = true;
  } else {
    console.log(`✅ ${pkg.name || relativeDir} sealed.`);
  }
}

if (checked === 0) {
  console.error("❌ No workspace package.json files were audited.");
  process.exit(1);
}

if (failed) {
  console.error("\n🚨 Workspace constitutional audit failed.");
  process.exit(1);
}

console.log(`\n✨ ${checked} workspace unit(s) conform to sovereign script standards.`);
