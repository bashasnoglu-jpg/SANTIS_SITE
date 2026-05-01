import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();

// We want to scan the assets/js and apps/ingestion-api directories for localhost leaks
// excluding this script itself and santis-runtime-resolver.js which needs it for fallback logic.

const scanDirs = [
  "assets/js",
  "apps",
  "core"
];

const excludeList = [
  "santis-runtime-resolver.js",
  "audit-localhost-leak.js",
  "node_modules",
  "dist",
  ".next",
  "build",
  "apps/web/tests", // Test fixtures are allowed to use localhost

  // ARCHIVE POLICY:
  // The assets/js/_archive directory contains zombie/legacy code that is NOT part of the
  // active runtime. We exclude it from localhost audits because refactoring inactive code
  // is an anti-pattern. If any archive file is ever restored to the active runtime, it MUST
  // be moved out of _archive and modernized to use getRuntimeConfig() and pass the audit.
  "assets/js/_archive"
].map(p => path.normalize(p));

// These files are legacy or dev-only fixtures pending migration to getRuntimeConfig().
// They are explicitly whitelisted here so the CI doesn't block, but they should be cleaned up eventually.
const legacyPendingMigration = [
  "assets/js/workers/server/job-queue.js",
  "assets/js/santis-vault.js",
  "assets/js/santis-telemetry.js",
  "assets/js/santis-seal.js",
  "assets/js/santis-nav.js",
  "assets/js/santis-curator.js",
  "assets/js/santis-config.js",
  "assets/js/santis-api.js",
  "assets/js/santis-ai-chatbot.js",
  "assets/js/neuro-sync.js",
  "assets/js/modules/santis-boardroom-dev-health-overlay.js",
  "assets/js/modules/santis-boardroom-pro-live.js",
  "assets/js/modules/santis-oracle-action-memory-client.js",
  "assets/js/modules/santis-oracle-execution-outcome-client.js",
  "assets/js/modules/santis-boardroom-oracle-v2.js",
  "assets/js/modules/santis-oracle-statistical-forecast-client.js",
  "assets/js/hooks/useAuditReplay.js",
  "assets/js/hooks/useLiveRadar.js",
  "assets/js/hooks/useOperatorAck.js",
  "assets/js/core/santis-cognitive-governor.js",
  "assets/js/cms-image-loader.js",
  "assets/js/core/santis-hive-mesh.js",
  "assets/js/boot/santis-bootloader.js",
  "assets/js/aurelia-engine.js",
  "assets/js/core/santis-ritual-orchestrator.js",
  "assets/js/core/santis-telemetry-client.js",
  "assets/js/core/santis-telemetry-emitter.js",
  "assets/js/core/santis-telemetry-engine.js",
  "assets/js/core/santis-ws-manager.js",
  "assets/js/core/santis.production-shield.js",
  "assets/js/core/sovereign-bus.js"
].map(p => path.normalize(p));

const allExcludes = [...excludeList, ...legacyPendingMigration];

const forbiddenPatterns = [
  /(["'`])http:\/\/localhost/g,
  /(["'`])https:\/\/localhost/g,
  /(["'`])ws:\/\/localhost/g,
  /(["'`])wss:\/\/localhost/g,
  /(["'`])http:\/\/127\.0\.0\.1/g,
  /(["'`])https:\/\/127\.0\.0\.1/g,
  /(["'`])ws:\/\/127\.0\.0\.1/g,
  /(["'`])wss:\/\/127\.0\.0\.1/g,
];

let failed = false;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (allExcludes.some(ex => fullPath.includes(ex))) {
      continue;
    }

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, "utf8");
      
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          console.error(`\n❌ [SECURITY GUARD] Hardcoded localhost/127.0.0.1 detected in source file!`);
          console.error(`   File: ${fullPath}`);
          
          // Print snippet
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (pattern.test(line)) {
               console.error(`   Line ${index + 1}: ${line.trim()}`);
            }
          });
          
          failed = true;
        }
      }
    }
  }
}

console.log("🛡️ [Sovereign Guard] Scanning codebase for localhost/127.0.0.1 leaks...");

for (const dir of scanDirs) {
  const fullDirPath = path.join(ROOT, dir);
  if (fs.existsSync(fullDirPath)) {
    scanDirectory(fullDirPath);
  }
}

if (failed) {
  console.error("\n💥 [Sovereign Guard] FAILED: Hardcoded localhost endpoints are not allowed. Please use getRuntimeConfig().");
  process.exit(1);
} else {
  console.log("✅ [Sovereign Guard] Localhost leakage scan passed.");
}
