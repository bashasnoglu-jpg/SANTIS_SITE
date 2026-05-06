#!/usr/bin/env node
/**
 * SANTIS OS — Production Environment Contract Audit
 * @description Validates that all required environment variables are set before production boot.
 * Run via: node scripts/active/audit-production-env.mjs
 * CI: Should execute before production deploy step.
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

console.log(`\n🛡️  [Sovereign Env Audit] NODE_ENV=${NODE_ENV}\n`);

let hasFailure = false;

for (const { key, description } of REQUIRED_VARS) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    console.error(`  ❌  MISSING: ${key}`);
    console.error(`      → ${description}\n`);
    hasFailure = true;
  } else {
    // Mask value for security — show only length
    const masked = "*".repeat(Math.min(value.length, 8));
    console.log(`  ✅  OK: ${key} (${masked}...)`);
  }
}

console.log("");

if (hasFailure) {
  console.error(
    "🚨 [Sovereign Env Audit] FAILED — one or more required environment variables are missing."
  );
  console.error("   Fix the above variables before deploying to production.\n");
  process.exit(1);
} else {
  console.log(
    "✅ [Sovereign Env Audit] PASSED — all required environment variables are present.\n"
  );
  process.exit(0);
}
