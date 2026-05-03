#!/usr/bin/env node
/**
 * Santis OS Zero-Trust Boundary Stress Runner
 *
 * Fail-fast hostile-path validation for Edge JWT, signed origin requests,
 * nonce replay protection, payload integrity and timestamp skew behavior.
 *
 * Required env:
 *   SANTIS_EDGE_URL   - public Cloudflare Worker/edge URL
 *   SANTIS_ORIGIN_URL - direct origin URL
 *
 * Optional env:
 *   SANTIS_TEST_JWT   - valid JWT for protected edge route tests
 *   SANTIS_EDGE_ORIGIN_SECRET - HMAC secret for direct origin signed-request tests
 *   SANTIS_CLOCK_SKEW_MS - expected allowed skew, default 60000
 */

import crypto from 'node:crypto';
import process from 'node:process';

const EDGE_URL = process.env.SANTIS_EDGE_URL;
const ORIGIN_URL = process.env.SANTIS_ORIGIN_URL;
const TEST_JWT = process.env.SANTIS_TEST_JWT || '';
const ORIGIN_SECRET = process.env.SANTIS_EDGE_ORIGIN_SECRET || '';
const CLOCK_SKEW_MS = Number(process.env.SANTIS_CLOCK_SKEW_MS || 60_000);
const PROTECTED_PATH = process.env.SANTIS_STRESS_PATH || '/api/v1/admin/bookings';

const required = { SANTIS_EDGE_URL: EDGE_URL, SANTIS_ORIGIN_URL: ORIGIN_URL };
for (const [name, value] of Object.entries(required)) {
  if (!value) {
    console.error(`❌ Missing required env: ${name}`);
    process.exit(1);
  }
}

function endpoint(base, path) {
  const url = new URL(base);
  url.pathname = path;
  url.search = '';
  return url.toString();
}

function bodyHash(body) {
  if (!body) return 'no-body';
  return crypto.createHash('sha256').update(body).digest('hex');
}

function signOrigin({ method = 'POST', path = PROTECTED_PATH, search = '', ts = Date.now(), nonce = crypto.randomUUID(), body = '' }) {
  if (!ORIGIN_SECRET) {
    throw new Error('SANTIS_EDGE_ORIGIN_SECRET is required for signed origin stress tests');
  }
  const hash = bodyHash(body);
  const canonical = [method, path, search, String(ts), nonce, hash].join('\n');
  const signature = crypto.createHmac('sha256', ORIGIN_SECRET).update(canonical).digest('hex');
  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Santis-Origin-Lock': 'cloudflare-edge',
      'X-Santis-Origin-Timestamp': String(ts),
      'X-Santis-Origin-Nonce': nonce,
      'X-Santis-Body-Hash': hash,
      'X-Santis-Origin-Signature': signature,
    },
    nonce,
    ts,
    signature,
    hash,
  };
}

async function request(url, options = {}) {
  const started = Date.now();
  const res = await fetch(url, options);
  const text = await res.text();
  return {
    status: res.status,
    ok: res.ok,
    text,
    headers: Object.fromEntries(res.headers.entries()),
    ms: Date.now() - started,
  };
}

function assertStatus(name, actual, expectedSet, response) {
  const expected = Array.isArray(expectedSet) ? expectedSet : [expectedSet];
  if (!expected.includes(actual)) {
    console.error(`\n❌ ${name} FAILED`);
    console.error(`Expected status: ${expected.join(' | ')}`);
    console.error(`Actual status:   ${actual}`);
    console.error('Response body:');
    console.error(response.text || '<empty>');
    process.exit(1);
  }
}

function logPass(name, response, detail = '') {
  console.log(`✅ ${name} PASS (${response.status}, ${response.ms}ms)${detail ? ` — ${detail}` : ''}`);
}

async function edgeUnauthorized() {
  const res = await request(endpoint(EDGE_URL, PROTECTED_PATH));
  assertStatus('Edge Unauthorized', res.status, 401, res);
  logPass('Edge Unauthorized', res, 'protected route rejected without JWT');
}

async function directOriginBypass() {
  const res = await request(endpoint(ORIGIN_URL, PROTECTED_PATH));
  assertStatus('Direct Origin Bypass', res.status, 403, res);
  logPass('Direct Origin Bypass', res, 'origin rejected unsigned direct request');
}

async function ghostReplay() {
  const body = JSON.stringify({ stress: 'ghost-replay', t: Date.now() });
  const signed = signOrigin({ body });
  const url = endpoint(ORIGIN_URL, PROTECTED_PATH);

  const first = await request(url, { method: 'POST', headers: signed.headers, body });
  assertStatus('Ghost Replay setup', first.status, [200, 201, 202, 204, 404], first);

  const replay = await request(url, { method: 'POST', headers: signed.headers, body });
  assertStatus('Ghost Replay', replay.status, 403, replay);
  logPass('Ghost Replay', replay, `nonce ${signed.nonce} rejected on second use`);
}

async function payloadPoisoning() {
  const originalBody = JSON.stringify({ stress: 'payload-poisoning', price: 100 });
  const poisonedBody = JSON.stringify({ stress: 'payload-poisoning', price: 1 });
  const signed = signOrigin({ body: originalBody, nonce: crypto.randomUUID() });
  const res = await request(endpoint(ORIGIN_URL, PROTECTED_PATH), {
    method: 'POST',
    headers: signed.headers,
    body: poisonedBody,
  });
  assertStatus('Payload Poisoning', res.status, 403, res);
  logPass('Payload Poisoning', res, 'modified body rejected');
}

async function timeWarp() {
  const body = JSON.stringify({ stress: 'time-warp' });
  const staleTs = Date.now() - CLOCK_SKEW_MS - 60_000;
  const futureTs = Date.now() + CLOCK_SKEW_MS + 60_000;

  const stale = signOrigin({ body, ts: staleTs, nonce: crypto.randomUUID() });
  const staleRes = await request(endpoint(ORIGIN_URL, PROTECTED_PATH), { method: 'POST', headers: stale.headers, body });
  assertStatus('Time Warp stale', staleRes.status, 403, staleRes);
  logPass('Time Warp stale', staleRes, `timestamp older than ${CLOCK_SKEW_MS}ms rejected`);

  const future = signOrigin({ body, ts: futureTs, nonce: crypto.randomUUID() });
  const futureRes = await request(endpoint(ORIGIN_URL, PROTECTED_PATH), { method: 'POST', headers: future.headers, body });
  assertStatus('Time Warp future', futureRes.status, 403, futureRes);
  logPass('Time Warp future', futureRes, `timestamp newer than ${CLOCK_SKEW_MS}ms rejected`);
}

async function edgeAuthorizedSmoke() {
  if (!TEST_JWT) {
    console.log('⚠️  Edge Authorized Smoke SKIPPED — SANTIS_TEST_JWT not provided');
    return;
  }

  const res = await request(endpoint(EDGE_URL, PROTECTED_PATH), {
    headers: { Authorization: `Bearer ${TEST_JWT}` },
  });
  assertStatus('Edge Authorized Smoke', res.status, [200, 201, 202, 204, 404], res);
  logPass('Edge Authorized Smoke', res, 'valid JWT reached protected route boundary');
}

async function main() {
  console.log('🛡️  Santis OS Zero-Trust Boundary Stress Runner');
  console.log(`Edge:   ${EDGE_URL}`);
  console.log(`Origin: ${ORIGIN_URL}`);
  console.log(`Path:   ${PROTECTED_PATH}`);
  console.log(`Skew:   ${CLOCK_SKEW_MS}ms\n`);

  await edgeUnauthorized();
  await directOriginBypass();
  await edgeAuthorizedSmoke();
  await ghostReplay();
  await payloadPoisoning();
  await timeWarp();

  console.log('\n🏁 BOUNDARY STRESS TESTS PASSED');
  console.log('The fortress rejected unauthorized, direct, replayed, tampered, stale and future hostile paths.');
}

main().catch((error) => {
  console.error('\n❌ Boundary stress runner crashed');
  console.error(error);
  process.exit(1);
});
