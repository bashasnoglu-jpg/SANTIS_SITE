/**
 * SANTIS OS — Sovereign Environment Auditor
 * Purpose: Enforces pnpm/Node runtime determinism before build execution.
 * Logic: Production-grade, zero-dependency, fail-fast validation.
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const REQUIRED_NODE_MAJOR = 20;
const REQUIRED_PNPM_MAJOR = 9;
const FORBIDDEN_LOCKFILES = [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
];

console.log("🛡️ [Sovereign Guard] Environment audit starting...");

let failed = false;

for (const file of FORBIDDEN_LOCKFILES) {
  if (fs.existsSync(file)) {
    console.error(`❌ Forbidden lockfile detected: ${file}`);
    failed = true;
  }
}

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
if (Number.isNaN(nodeMajor) || nodeMajor < REQUIRED_NODE_MAJOR) {
  console.error(`❌ Node.js ${REQUIRED_NODE_MAJOR}+ required. Current: ${process.versions.node}`);
  failed = true;
} else {
  console.log(`✅ Node.js runtime sealed: ${process.versions.node}`);
}

try {
  const pnpmVersion = execSync("pnpm --version", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const pnpmMajor = Number.parseInt(pnpmVersion.split(".")[0], 10);

  if (Number.isNaN(pnpmMajor) || pnpmMajor < REQUIRED_PNPM_MAJOR) {
    console.error(`❌ pnpm ${REQUIRED_PNPM_MAJOR}+ required. Current: ${pnpmVersion}`);
    failed = true;
  } else {
    console.log(`✅ pnpm runtime sealed: ${pnpmVersion}`);
  }
} catch {
  console.error("❌ pnpm is required but was not found in PATH.");
  failed = true;
}

if (failed) {
  console.error("\n🚨 Environment constitutional audit failed.");
  process.exit(1);
}

console.log("\n✨ Environment conforms to sovereign runtime standards.");
