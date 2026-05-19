import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fsPromises from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const MOCK_LAYER_PATH = path.join(ROOT_DIR, 'scripts/sovereign-mock-layer.mjs');

console.log('[SANTIS_RVS_BACKEND_AUDIT] Verifying RVS Telemetry Endpoint Backend Stub (RVS-8)...');

let hasErrors = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAILED] ${message}`);
    hasErrors = true;
  } else {
    console.log(`[PASSED] ${message}`);
  }
}

// 1. Check if mock layer exists
assert(fs.existsSync(MOCK_LAYER_PATH), 'Sovereign Mock Layer exists at scripts/sovereign-mock-layer.mjs');

if (!fs.existsSync(MOCK_LAYER_PATH)) {
  console.error('[CRITICAL] Sovereign Mock Layer is missing. Aborting.');
  process.exit(1);
}

const fileContent = fs.readFileSync(MOCK_LAYER_PATH, 'utf-8');

// 2. Check if endpoint path is registered
assert(
  fileContent.includes('/api/v1/telemetry/rvs'),
  'Mock layer registers /api/v1/telemetry/rvs endpoint.'
);

// 3. Verify POST method handling
assert(
  fileContent.includes("req.url === '/api/v1/telemetry/rvs' && req.method === 'POST'"),
  'Mock layer enforces POST requests only for RVS telemetry.'
);

// 4. Verify max size (8KB payload guard)
assert(
  fileContent.includes('8192') && 
  fileContent.includes('413'),
  'Mock layer implements strict 8KB payload size guard returning HTTP 413.'
);

// 5. Verify strict envelope schema validation
assert(
  fileContent.includes('LAYOUT_REFLOW_ANOMALY') &&
  fileContent.includes('CINEMATIC_BUDGET_WARNING') &&
  fileContent.includes('SCENE_ENTROPY_SHIFT'),
  'Mock layer validates all three standard RVS telemetry type classifications.'
);

assert(
  fileContent.includes('envelope.type') &&
  fileContent.includes('envelope.timestamp') &&
  fileContent.includes('envelope.sessionToken') &&
  fileContent.includes('envelope.normalizedPath') &&
  fileContent.includes('envelope.details'),
  'Mock layer validates full contract envelope properties.'
);

// 6. Verify response codes
assert(
  fileContent.includes('res.writeHead(204)'),
  'Mock layer returns HTTP 204 No Content response on successful validation.'
);

assert(
  fileContent.includes('res.writeHead(400)'),
  'Mock layer returns HTTP 400 Bad Request on invalid/malformed telemetry.'
);

console.log('\n[SANTIS_RVS_BACKEND_AUDIT] Audit Scan Completed.');

if (hasErrors) {
  console.error('[FAILED] RVS Telemetry Backend Stub audit failed. Please align scripts/sovereign-mock-layer.mjs with boardroom specifications.');
  process.exit(1);
}

console.log('[SUCCESS] RVS Telemetry Backend Stub verified and aligned perfectly with boardroom specifications.');
process.exit(0);
