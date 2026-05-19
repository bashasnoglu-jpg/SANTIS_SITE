import { spawn } from 'child_process';
import http from 'http';

console.log('🛡️ [Sovereign Ingestion Guard] Starting RVS Telemetry Endpoint Behavior Audit...');

const TEST_PORT = 3030;
const ENDPOINT_URL = `http://localhost:${TEST_PORT}/api/v1/telemetry/rvs`;

// Start the mock layer server
const serverProcess = spawn('node', ['scripts/sovereign-mock-layer.mjs'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: TEST_PORT }
});

let serverReady = false;

// Wait for server to start
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    serverProcess.kill();
    reject(new Error('Server failed to start within 5 seconds'));
  }, 5000);

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('aktif ve dinleniyor') || output.includes('Truth Layer')) {
      serverReady = true;
      clearTimeout(timeout);
      resolve();
    }
  });

  serverProcess.on('error', (err) => {
    clearTimeout(timeout);
    reject(err);
  });
});

console.log('✅ Mock Ingestion Server successfully started on port 3030.');

let failedTests = 0;

async function assertResponse(testName, payload, expectedStatus) {
  try {
    const res = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload)
    });

    if (res.status === expectedStatus) {
      console.log(`[PASSED] ${testName} -> Returned expected status: ${res.status}`);
    } else {
      console.error(`[FAILED] ${testName} -> Expected: ${expectedStatus}, Got: ${res.status}`);
      failedTests++;
    }
  } catch (err) {
    console.error(`[FAILED] ${testName} -> Request error: ${err.message}`);
    failedTests++;
  }
}

// Test Case 1: Perfect Envelope
const validEnvelope = {
  type: 'LAYOUT_REFLOW_ANOMALY',
  timestamp: Date.now(),
  sessionToken: 'anon_session_luxury_99',
  normalizedPath: '/spa-booking',
  details: {
    targetNode: 'main#nv-main > div.nv-figure',
    durationMs: 14,
    violatingProperty: 'offsetHeight'
  }
};
await assertResponse('Test 1: Valid Telemetry Envelope', validEnvelope, 204);

// Test Case 2: Size Limit Violation (8KB+)
const hugeDetails = 'A'.repeat(9000);
const hugeEnvelope = {
  type: 'LAYOUT_REFLOW_ANOMALY',
  timestamp: Date.now(),
  sessionToken: 'anon_session_huge',
  normalizedPath: '/spa-booking',
  details: {
    targetNode: 'main#nv-main',
    violatingProperty: hugeDetails
  }
};
await assertResponse('Test 2: Payload Size Violation (8KB+)', hugeEnvelope, 400);

// Test Case 3: PII Security Violation (Contains password key)
const piiEnvelope = {
  type: 'LAYOUT_REFLOW_ANOMALY',
  timestamp: Date.now(),
  sessionToken: 'anon_session_pii',
  normalizedPath: '/spa-booking',
  details: {
    targetNode: 'main#nv-main',
    password: 'supersecretpassword123'
  }
};
await assertResponse('Test 3: PII Security Violation (Key pattern)', piiEnvelope, 400);

// Test Case 4: sessionToken Formatting Violation (No anon_ prefix)
const invalidTokenEnvelope = {
  type: 'LAYOUT_REFLOW_ANOMALY',
  timestamp: Date.now(),
  sessionToken: 'invalid_token_123',
  normalizedPath: '/spa-booking',
  details: {
    targetNode: 'main#nv-main'
  }
};
await assertResponse('Test 4: sessionToken Format Violation (No prefix)', invalidTokenEnvelope, 400);

// Test Case 5: Schema Violation (Missing type)
const missingTypeEnvelope = {
  timestamp: Date.now(),
  sessionToken: 'anon_session_missing',
  normalizedPath: '/spa-booking',
  details: {
    targetNode: 'main#nv-main'
  }
};
await assertResponse('Test 5: Schema Violation (Missing type)', missingTypeEnvelope, 400);

// Test Case 6: normalizedPath Type Violation
const invalidPathEnvelope = {
  type: 'LAYOUT_REFLOW_ANOMALY',
  timestamp: Date.now(),
  sessionToken: 'anon_session_path',
  normalizedPath: 'invalid-route-no-slash',
  details: {
    targetNode: 'main#nv-main'
  }
};
await assertResponse('Test 6: normalizedPath Type Violation (No leading slash)', invalidPathEnvelope, 400);

// Test Case 7: details Type Violation (Is Array)
const invalidDetailsEnvelope = {
  type: 'LAYOUT_REFLOW_ANOMALY',
  timestamp: Date.now(),
  sessionToken: 'anon_session_details',
  normalizedPath: '/spa-booking',
  details: ['invalid-details-array']
};
await assertResponse('Test 7: details Type Violation (Is Array)', invalidDetailsEnvelope, 400);

// Cleanup
serverProcess.kill();
console.log('🔌 Test Ingestion Server terminated.');

console.log('\n🛡️ [Sovereign Ingestion Guard] Behavior Audit Completed.');
if (failedTests > 0) {
  console.error(`❌ [FAILED] RVS Telemetry Endpoint behavior verification failed. Total failures: ${failedTests}`);
  process.exit(1);
} else {
  console.log('✅ [SUCCESS] RVS Telemetry Ingestion endpoint behavior validated and fully verified.');
  process.exit(0);
}
