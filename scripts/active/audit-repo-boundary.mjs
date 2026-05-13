import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const FORBIDDEN_PATHS = [
  'server',
  'nexus-signaling-server',
  'apps/api',
  'apps/ingestion-api',
  'packages/db',
  'packages/decision-kernel',
  'packages/event-dictionary',
  'santis-os-monorepo',
  'santis-live-simulator'
];

let hasViolations = false;

console.log('[SANTIS_AUDIT] Starting Repo Boundary Enforcement Scan...');

for (const forbiddenPath of FORBIDDEN_PATHS) {
  const fullPath = path.join(ROOT_DIR, forbiddenPath);
  
  if (fs.existsSync(fullPath)) {
    console.error(`\n[VIOLATION] Forbidden operational path detected: ${forbiddenPath}`);
    console.error(`This directory violates the repository boundary defined in docs/REPO_BOUNDARY.md.`);
    console.error(`It must be archived or moved to the private Santis OS infrastructure.`);
    hasViolations = true;
  }
}

if (hasViolations) {
  console.error('\n[FAILED] Repo Boundary Enforcement failed. Forbidden active paths found.');
  process.exit(1);
} else {
  console.log('\n[PASSED] Repo Boundary Enforcement passed. No forbidden active paths found.');
  process.exit(0);
}
