/**
 * SANTIS_SITE — API Drift & Navigation Health Check
 * Issue #39 kapsamında API uç noktalarının durumunu kontrol eder.
 *
 * Kullanım:
 *   node scripts/test-api-drift.mjs
 *   node scripts/test-api-drift.mjs --port 3030
 */

import http from 'http';

// ── Config ────────────────────────────────────────────────────────────────────

const portArg = process.argv.find((a) => a.startsWith('--port='));
const PORT    = portArg ? portArg.split('=')[1] : '3030';
const BASE    = `http://127.0.0.1:${PORT}`;

const ENDPOINTS = [
  { name: 'Nav Manifest',          path: '/api/v1/nav-manifest' },
  { name: 'Core State',            path: '/api/v1/core-state' },
  { name: 'Core State Stream',     path: '/api/v1/core-state/stream',  expectCode: [200, 204] },
  { name: 'Replay Boardroom',      path: '/admin/replay/boardroom',    expectCode: [200, 401, 403] },
  { name: 'Health',                path: '/health',                    expectCode: [200, 204] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function checkEndpoint({ name, path, expectCode = [200] }) {
  const url = `${BASE}${path}`;
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      const ok = expectCode.includes(res.statusCode);
      const icon = ok ? '✅' : '❌';
      console.log(`  ${icon}  ${name.padEnd(26)} ${res.statusCode}  ${url}`);
      // Drain body to avoid hanging
      res.resume();
      resolve({ name, status: res.statusCode, ok });
    });
    req.setTimeout(3000);
    req.on('error', (err) => {
      console.log(`  ❌  ${name.padEnd(26)} ERİŞİLEMEDİ  ${url}`);
      console.log(`       └─ ${err.message}`);
      resolve({ name, status: null, ok: false });
    });
    req.on('timeout', () => {
      req.destroy();
      console.log(`  ⏱️  ${name.padEnd(26)} TIMEOUT       ${url}`);
      resolve({ name, status: null, ok: false });
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n── Santis API Drift Testi ─────────────────────────────────────');
  console.log(`   Target: ${BASE}`);
  console.log('───────────────────────────────────────────────────────────────\n');

  const results = [];
  for (const ep of ENDPOINTS) {
    results.push(await checkEndpoint(ep));
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`   ${passed}/${results.length} endpoint sağlıklı${failed > 0 ? ` — ${failed} başarısız` : ' ✅'}`);

  if (failed > 0) {
    console.log('\n   Başarısız endpointler:');
    results.filter((r) => !r.ok).forEach((r) => {
      console.log(`   · ${r.name} (HTTP ${r.status ?? 'N/A'})`);
    });
    console.log('\n   Olası nedenler:');
    console.log('   · ingestion-api çalışmıyor (pnpm --filter ingestion-api dev)');
    console.log('   · Route kayıt edilmemiş (routes/index.ts)');
    console.log('   · Auth middleware 401 döndürüyor (beklenen → expectCode güncelle)');
  }

  console.log('───────────────────────────────────────────────────────────────\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
