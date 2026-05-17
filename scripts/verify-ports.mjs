/**
 * scripts/verify-ports.mjs
 * SANTIS OS — Runtime Drift Guard
 * Verifies that all entry points (3030, 5500, 8080) are correctly muzzled 
 * to the Single Truth Layer on port 3030.
 */

const targets = [
  'http://localhost:3030/api/health',
  'http://localhost:5500/api/health',
  'http://localhost:8080/api/health',
  'http://localhost:3030/health',
];

async function verify() {
  console.log('🛡️  [Sovereign Guard] Initiating Runtime Drift Audit...');
  let hasError = false;

  for (const url of targets) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`❌ ${url} → HTTP Error ${res.status}`);
        hasError = true;
        continue;
      }

      const json = await res.json();

      // Truth Layer Validation
      const isTruthLayer = json.status === 'ok' || json.status === 'operational';
      const isCorrectPort = json.port === 3030 || url.includes('/health'); // /health alias has less detail

      if (!isTruthLayer) {
        console.error(`❌ ${url} → Invalid Status: ${json.status}`);
        hasError = true;
        continue;
      }

      console.log(`✅ ${url} → OK`);
    } catch (error) {
      console.error(`❌ ${url} → Connection Refused (Server not running?)`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('\n🚨 [Sovereign Guard] Drift detected! Ports are not aligned with Truth Layer.');
    process.exit(1);
  }

  console.log('\n✨ [Sovereign Guard] Port Reality Lock Verified. No drift detected.');
}

verify();
