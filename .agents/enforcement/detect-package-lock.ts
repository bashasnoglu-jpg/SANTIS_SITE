import fs from 'fs';
import path from 'path';

// Passive Governance: Detect, measure, report. Do not block.
const FORBIDDEN_FILES = ['package-lock.json', 'yarn.lock'];
const IGNORE_DIRS = ['node_modules', '.git', '.turbo', 'dist', 'build', '.agents'];

let violationCount = 0;
const violations: string[] = [];

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        scanDirectory(fullPath);
      }
    } else if (FORBIDDEN_FILES.includes(file)) {
      violations.push(fullPath);
      violationCount++;
    }
  }
}

console.log("==================================================");
console.log("🛡️  PASSIVE GOVERNANCE: PACKAGE MANAGER DRIFT SCAN");
console.log("==================================================");

try {
  scanDirectory(process.cwd());

  if (violationCount > 0) {
    console.log(`\n⚠️  DETECTED ${violationCount} ROGUE PACKAGE LOCK FILES:\n`);
    violations.forEach((v, index) => {
      console.log(`[${index + 1}] File: ${v}`);
    });
    console.log("\nSTATUS: REPORT ONLY. No auto-deletion occurred (ZeroTechnicalDebt Rule).");
    console.log("Boardroom approval is required before running `rm` operations.");
  } else {
    console.log("\n✅  NO ROGUE LOCK FILES DETECTED. PNPM sovereignty maintained.");
  }
} catch (error) {
  console.error("Scanner encountered an error:", error);
}
