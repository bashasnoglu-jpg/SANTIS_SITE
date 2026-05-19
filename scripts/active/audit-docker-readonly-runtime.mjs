import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`\n${colors.cyan}${colors.bold}🛡️  [Sovereign Guard] Executing TD-008.4 Read-Only Runtime Mutability Proof...${colors.reset}\n`);

const testCases = [
  // ── API Container ──────────────────────────────────────────────────────────
  {
    service: 'api',
    path: '/tmp/td0084-ok',
    expected: 'PASS',
    command: 'docker compose exec api sh -c "touch /tmp/td0084-ok && rm /tmp/td0084-ok"'
  },
  {
    service: 'api',
    path: '/app/td0084-should-fail',
    expected: 'FAIL',
    command: 'docker compose exec api sh -c "touch /app/td0084-should-fail"'
  },
  // ── Web Container ──────────────────────────────────────────────────────────
  {
    service: 'web',
    path: '/tmp/td0084-ok',
    expected: 'PASS',
    command: 'docker compose exec web sh -c "touch /tmp/td0084-ok && rm /tmp/td0084-ok"'
  },
  {
    service: 'web',
    path: '/usr/share/nginx/html/td0084-should-fail',
    expected: 'FAIL',
    command: 'docker compose exec web sh -c "touch /usr/share/nginx/html/td0084-should-fail"'
  },
  // ── Admin-Panel Container ──────────────────────────────────────────────────
  {
    service: 'admin-panel',
    path: '/tmp/td0084-ok',
    expected: 'PASS',
    command: 'docker compose exec admin-panel sh -c "touch /tmp/td0084-ok && rm /tmp/td0084-ok"'
  },
  {
    service: 'admin-panel',
    path: '/usr/share/nginx/html/td0084-should-fail',
    expected: 'FAIL',
    command: 'docker compose exec admin-panel sh -c "touch /usr/share/nginx/html/td0084-should-fail"'
  }
];

let failedTests = 0;

console.log(`${colors.bold}MUTABILITY TESTING MATRIX:${colors.reset}`);
console.log('─'.repeat(80));
console.log(`${colors.bold}${'Service'.padEnd(15)} | ${'Target Path'.padEnd(42)} | ${'Expected'.padEnd(10)} | ${'Status'}${colors.reset}`);
console.log('─'.repeat(80));

for (const tc of testCases) {
  let actual = 'FAIL';
  try {
    execSync(tc.command, { stdio: 'ignore' });
    actual = 'PASS';
  } catch (err) {
    actual = 'FAIL';
  }

  const isMatched = actual === tc.expected;
  const statusSymbol = isMatched 
    ? `${colors.green}✅ MATCHED (${actual})${colors.reset}` 
    : `${colors.red}❌ MISMATCHED (Actual: ${actual})${colors.reset}`;

  if (!isMatched) {
    failedTests++;
  }

  console.log(`${tc.service.padEnd(15)} | ${tc.path.padEnd(42)} | ${tc.expected.padEnd(10)} | ${statusSymbol}`);
}

console.log('─'.repeat(80));

// ── HTTP Endpoint Verification ──────────────────────────────────────────────
console.log(`\n${colors.bold}HTTP ENDPOINT HEALTH INTEGRITY CHECK:${colors.reset}`);
console.log('─'.repeat(80));

const endpoints = [
  { name: 'API Health', url: 'http://localhost:8000/health', expected: 200 },
  { name: 'Web Health', url: 'http://localhost:8080/healthz', expected: 200 },
  { name: 'Admin Health', url: 'http://localhost:8081/healthz', expected: 200 }
];

for (const ep of endpoints) {
  let status = 0;
  try {
    const res = execSync(`curl -s -o /dev/null -w "%{http_code}" ${ep.url}`).toString().trim();
    status = parseInt(res, 10);
  } catch (err) {
    // Retry with windows curl if default failed
    try {
      const res = execSync(`curl.exe -s -o NUL -w "%{http_code}" ${ep.url}`).toString().trim();
      status = parseInt(res, 10);
    } catch (_) {}
  }

  const isMatched = status === ep.expected;
  const statusSymbol = isMatched 
    ? `${colors.green}✅ OK (200)${colors.reset}` 
    : `${colors.red}❌ FAILED (${status || 'No Response'})${colors.reset}`;

  if (!isMatched) {
    failedTests++;
  }

  console.log(`${ep.name.padEnd(15)} | ${ep.url.padEnd(42)} | ${ep.expected.toString().padEnd(10)} | ${statusSymbol}`);
}
console.log('─'.repeat(80));

if (failedTests === 0) {
  console.log(`\n${colors.green}${colors.bold}🛡️  [PASSED] Read-Only Runtime Mutability Proof sealed successfully! No write escapes detected.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}${colors.bold}🚨  [FAILED] Mutability verification detected write escapes or offline endpoints!${colors.reset}\n`);
  process.exit(1);
}
