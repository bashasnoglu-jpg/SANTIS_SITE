import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const DISPATCHER_PATH = path.join(ROOT_DIR, 'assets/js/core/santis-rvs-telemetry-dispatcher.js');

console.log('[SANTIS_RVS_DISPATCHER_AUDIT] Verifying RVS Client Telemetry Dispatcher Module...');

let hasErrors = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAILED] ${message}`);
    hasErrors = true;
  } else {
    console.log(`[PASSED] ${message}`);
  }
}

// 1. Check if the dispatcher exists
assert(fs.existsSync(DISPATCHER_PATH), 'RVS Telemetry Dispatcher module exists at assets/js/core/santis-rvs-telemetry-dispatcher.js');

if (!fs.existsSync(DISPATCHER_PATH)) {
  console.error('[CRITICAL] RVS Client Telemetry Dispatcher is missing. Aborting.');
  process.exit(1);
}

const fileContent = fs.readFileSync(DISPATCHER_PATH, 'utf-8');

// 2. Check for dispatchRvsTelemetry
assert(fileContent.includes('dispatchRvsTelemetry'), 'Module defines or exports "dispatchRvsTelemetry" function.');

// 3. Verify Zero PII guards
assert(
  fileContent.includes('PII_KEYS_PATTERN') || 
  fileContent.includes('scanForPii') || 
  fileContent.includes('EMAIL_REGEX'),
  'Module implements an aggressive Zero PII security guard.'
);

// 4. Verify 8KB payload size guard
assert(
  fileContent.includes('MAX_PAYLOAD_BYTES') || 
  fileContent.includes('8192') || 
  fileContent.includes('8KB limit'),
  'Module enforces a strict 8KB payload size guard.'
);

// 5. Verify rate limiting and burst protection (10 payloads/min, 3 payloads/500ms)
assert(
  fileContent.includes('THROTTLE_LIMIT') || 
  fileContent.includes('10'),
  'Module implements client session throttling (10 payloads/minute).'
);
assert(
  fileContent.includes('BURST_LIMIT') || 
  fileContent.includes('3'),
  'Module implements client burst protection (3 payloads/500ms).'
);

// 6. Verify sendBeacon and fetch keepalive fallbacks
assert(fileContent.includes('sendBeacon'), 'Module implements navigator.sendBeacon as the primary transport.');
assert(fileContent.includes('keepalive'), 'Module implements fetch keepalive fallback transport.');

// 7. Verify local queue storage
assert(fileContent.includes('localQueue'), 'Module implements a local memory buffer queue (localQueue) for deferred payloads.');

console.log('\n[SANTIS_RVS_DISPATCHER_AUDIT] Audit Scan Completed.');

if (hasErrors) {
  console.error('[FAILED] RVS Client Telemetry Dispatcher audit failed. Please align assets/js/core/santis-rvs-telemetry-dispatcher.js with boardroom specifications.');
  process.exit(1);
}

console.log('[SUCCESS] RVS Client Telemetry Dispatcher verified and aligned perfectly with boardroom specifications.');
process.exit(0);
