import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const DOC_PATH = path.join(ROOT_DIR, 'docs/governance/telemetry-endpoint-contract.md');

console.log('[SANTIS_RVS_TELEMETRY_CONTRACT_AUDIT] Verifying RVS Telemetry Endpoint Contract...');

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
assert(fs.existsSync(DOC_PATH), 'Telemetry Endpoint Governance document exists at docs/governance/telemetry-endpoint-contract.md');

if (!fs.existsSync(DOC_PATH)) {
  console.error('[CRITICAL] Telemetry endpoint governance document is missing. Aborting.');
  process.exit(1);
}

const docContent = fs.readFileSync(DOC_PATH, 'utf-8');

// 2. Check for the Endpoint URI
assert(docContent.includes('/api/v1/telemetry/rvs'), 'Document specifies the telemetry endpoint URI (/api/v1/telemetry/rvs).');

// 3. Verify Payload Classifications
assert(docContent.includes('LAYOUT_REFLOW_ANOMALY'), 'Document defines "LAYOUT_REFLOW_ANOMALY" payload type.');
assert(docContent.includes('CINEMATIC_BUDGET_WARNING'), 'Document defines "CINEMATIC_BUDGET_WARNING" payload type.');
assert(docContent.includes('SCENE_ENTROPY_SHIFT'), 'Document defines "SCENE_ENTROPY_SHIFT" payload type.');

// 4. Verify Telemetry Envelope Interface
assert(docContent.includes('interface RvsTelemetryEnvelope'), 'RvsTelemetryEnvelope interface is defined in the contract.');
assert(docContent.includes('type RvsTelemetryType ='), 'RvsTelemetryType union type is defined.');

// 5. Verify Privacy-Safe Payload Standard
assert(docContent.includes('Privacy-Safe Payload Standard') || docContent.includes('Zero PII Policy'), 'Document describes the privacy-safe payload standard (Zero PII).');

// 6. Verify Rate Limiting & Throttle Policy
assert(docContent.includes('Rate Limiting & Throttle Policy') || docContent.includes('Client Session Throttling'), 'Document specifies the rate limiting and throttle policy.');

// 7. Verify sendBeacon Fallback Mechanics
assert(docContent.includes('sendBeacon') && docContent.includes('keepalive'), 'Document details navigator.sendBeacon and keepalive fallback dispatch mechanics.');

console.log('\n[SANTIS_RVS_TELEMETRY_CONTRACT_AUDIT] Audit Scan Completed.');

if (hasErrors) {
  console.error('[FAILED] RVS Telemetry Endpoint contract audit failed. Please align docs/governance/telemetry-endpoint-contract.md with boardroom specifications.');
  process.exit(1);
}

console.log('[SUCCESS] RVS Telemetry Endpoint contract aligned perfectly with boardroom specifications.');
process.exit(0);
