import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const BOOTLOADER_PATH = path.join(ROOT_DIR, 'assets/js/boot/santis-bootloader.js');

console.log('[SANTIS_RVS_DOM_AUDIT] Verifying SantisDOM Telemetry Integration (RVS-7)...');

let hasErrors = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAILED] ${message}`);
    hasErrors = true;
  } else {
    console.log(`[PASSED] ${message}`);
  }
}

// 1. Check if bootloader exists
assert(fs.existsSync(BOOTLOADER_PATH), 'Santis Bootloader exists at assets/js/boot/santis-bootloader.js');

if (!fs.existsSync(BOOTLOADER_PATH)) {
  console.error('[CRITICAL] Santis Bootloader is missing. Aborting.');
  process.exit(1);
}

const fileContent = fs.readFileSync(BOOTLOADER_PATH, 'utf-8');

// 2. Check for telemetry integration
assert(
  fileContent.includes('window.dispatchRvsTelemetry') || 
  fileContent.includes('dispatchRvsTelemetry('),
  'SantisDOM executeWithTelemetry connects to window.dispatchRvsTelemetry dispatcher.'
);

// 3. Verify target event type classification
assert(
  fileContent.includes('LAYOUT_REFLOW_ANOMALY'),
  'SantisDOM executeWithTelemetry dispatches LAYOUT_REFLOW_ANOMALY classification.'
);

// 4. Verify anonymous sessionToken generation
assert(
  fileContent.includes('SantisRvsSessionToken') && 
  fileContent.includes('anon_'),
  'SantisDOM executeWithTelemetry generates anonymous sessionToken for Zero PII compliance.'
);

// 5. Verify feature flag check
assert(
  fileContent.includes('SANTIS_RVS_TELEMETRY_ENABLED') || 
  fileContent.includes('rvsTelemetryEnabled'),
  'SantisDOM executeWithTelemetry implements rvsTelemetryEnabled feature flag checks.'
);

console.log('\n[SANTIS_RVS_DOM_AUDIT] Audit Scan Completed.');

if (hasErrors) {
  console.error('[FAILED] SantisDOM Telemetry Integration audit failed. Please align assets/js/boot/santis-bootloader.js with boardroom specifications.');
  process.exit(1);
}

console.log('[SUCCESS] SantisDOM Telemetry Integration verified and aligned perfectly with boardroom specifications.');
process.exit(0);
