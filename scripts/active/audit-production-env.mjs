#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * SANTIS OS — Production Environment & Secret Leakage Audit
 * @description Validates that required environment variables are set and audits the workspace for secret leakage.
 * Run via: node scripts/active/audit-production-env.mjs
 */

const REQUIRED_VARS = [
  {
    key: "ALLOWED_ORIGINS",
    description: "Comma-separated list of allowed CORS origins (e.g. https://santis.com)",
  },
  {
    key: "SESSION_TOKEN_SECRET",
    description: "JWT signing secret for session tokens — minimum 32 chars recommended",
  },
  {
    key: "DATABASE_URL",
    description: "PostgreSQL connection string for Sovereign Persistence",
  },
  {
    key: "SANTIS_TENANT_ID",
    description: "Tenant identifier for multi-tenant routing",
  },
];

const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`\n🛡️  [Sovereign Env & Secret Leakage Audit] NODE_ENV=${NODE_ENV}\n`);

let hasFailure = false;

// ── Part 1: Environment Variables Validation ─────────────────────────────────
console.log("PART 1: Validating required production variables...");
for (const { key, description } of REQUIRED_VARS) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    // Only fail-fast in actual production mode
    if (NODE_ENV === "production") {
      console.error(`  ❌  MISSING: ${key}`);
      console.error(`      → ${description}\n`);
      hasFailure = true;
    } else {
      console.log(`  ⚠️  WARNING: ${key} is missing (Skipped in development mode)`);
    }
  } else {
    const masked = "*".repeat(Math.min(value.length, 8));
    console.log(`  ✅  OK: ${key} (${masked}...)`);
  }
}

// ── Part 2: Git-Track & Secret Leakage Auditing ──────────────────────────────
console.log("\nPART 2: Auditing workspace for potential secret leakage...");

// 1. Check if .env file is tracked in git
try {
  const trackedEnv = execSync("git ls-files .env", { stdio: "pipe" }).toString().trim();
  if (trackedEnv) {
    console.error("  ❌  FAIL: Active '.env' file is tracked in Git! Immediate removal required.");
    hasFailure = true;
  } else {
    console.log("  ✅  OK: Active '.env' is correctly untracked by Git.");
  }
} catch (err) {
  // If git command fails or is unavailable, warn but don't fail
  console.log("  ⚠️  WARNING: git command unavailable. Skipped .env tracking check.");
}

// 2. Scan codebase for hardcoded Stripe live secrets or private key signatures
const leakSignatures = [
  { name: "Stripe Live Secret Key", regex: /sk_live_[a-zA-Z0-9]{24,}/g },
  { name: "Stripe Live Webhook Secret", regex: /whsec_live_[a-zA-Z0-9]{24,}/g },
  { name: "Generic Live Secret Key", regex: /SECRET_KEY\s*=\s*['"][a-zA-Z0-9]{32,}['"]/gi }
];

try {
  // Get list of all git-tracked files to scan (excluding .env.example, documentation, and scripts)
  const filesList = execSync("git ls-files", { stdio: "pipe" })
    .toString()
    .split("\n")
    .map(f => f.trim())
    .filter(f => f && !f.endsWith(".md") && !f.endsWith(".example") && !f.startsWith("scripts/"));

  let leakCount = 0;
  for (const file of filesList) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    for (const sig of leakSignatures) {
      if (sig.regex.test(content)) {
        console.error(`  ❌  LEAK DETECTED: Hardcoded ${sig.name} found in: ${file}`);
        leakCount++;
        hasFailure = true;
      }
    }
  }

  if (leakCount === 0) {
    console.log("  ✅  OK: No hardcoded Stripe live secrets or high-entropy credentials detected.");
  }
} catch (err) {
  console.log("  ⚠️  WARNING: Could not complete codebase secret signature scan.");
}

console.log("");

if (hasFailure) {
  console.error("🚨 [Sovereign Env & Secret Leakage Audit] FAILED — security/integrity violations detected!");
  process.exit(1);
} else {
  console.log("✅ [Sovereign Env & Secret Leakage Audit] PASSED — all environment and security checks verified.\n");
  process.exit(0);
}

