import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const DOC_PATH = path.join(ROOT_DIR, 'docs/governance/runtime-visual-stability.md');

console.log('[SANTIS_RVS_ENTROPY_AUDIT] Verifying Scene Entropy Visual Governance Contract...');

let hasErrors = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAILED] ${message}`);
    hasErrors = true;
  } else {
    console.log(`[PASSED] ${message}`);
  }
}

// 1. Check if the document exists
assert(fs.existsSync(DOC_PATH), 'Visual Stability Governance document exists at docs/governance/runtime-visual-stability.md');

if (!fs.existsSync(DOC_PATH)) {
  console.error('[CRITICAL] Visual stability governance document is missing. Aborting.');
  process.exit(1);
}

const docContent = fs.readFileSync(DOC_PATH, 'utf-8');

// 2. Check if SceneEntropyPayload is defined
assert(docContent.includes('interface SceneEntropyPayload'), 'SceneEntropyPayload interface is defined in the contract.');

// 3. Verify fields inside the interface
assert(docContent.includes('entropyScore:'), 'SceneEntropyPayload has "entropyScore" field.');
assert(docContent.includes('metrics:'), 'SceneEntropyPayload has "metrics" block.');
assert(docContent.includes('performance:'), 'SceneEntropyPayload has "performance" block.');
assert(docContent.includes('governanceState:'), 'SceneEntropyPayload has "governanceState" field.');

// 4. Verify states inside the document
assert(docContent.includes('SILENT'), 'Document includes "SILENT" governance state.');
assert(docContent.includes('GOVERNED'), 'Document includes "GOVERNED" governance state.');
assert(docContent.includes('BUDGET_EXCEEDED'), 'Document includes "BUDGET_EXCEEDED" governance state.');

// 5. Verify the timestamp JSDoc details
const hasUnixEpochComment = docContent.includes('Unix epoch timestamp in milliseconds');
assert(hasUnixEpochComment, 'SceneEntropyPayload timestamp has correct Unix epoch millisecond definition JSDoc.');

console.log('\n[SANTIS_RVS_ENTROPY_AUDIT] Audit Scan Completed.');

if (hasErrors) {
  console.error('[FAILED] Scene Entropy visual governance contract audit failed. Please align docs/governance/runtime-visual-stability.md with standard boardroom specifications.');
  process.exit(1);
}

console.log('[SUCCESS] Scene Entropy visual governance contract aligned perfectly with boardroom specifications.');
process.exit(0);
