import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`\n${colors.cyan}${colors.bold}🛡️  [Sovereign Guard] Executing Docker Config & Port Leakage Audits...${colors.reset}\n`);

let failed = false;

// ── 1. Base Configuration Check ──────────────────────────────────────────────
console.log(`${colors.bold}STEP 1: Validating Base docker-compose config syntax...${colors.reset}`);
try {
  const baseJson = execSync('docker compose config --format json').toString();
  const baseConfig = JSON.parse(baseJson);
  console.log(`  ${colors.green}✅ Base configuration syntax is valid.${colors.reset}`);
} catch (err) {
  console.error(`  ${colors.red}❌ Base configuration syntax is invalid: ${err.message}${colors.reset}`);
  failed = true;
}

// ── 2. Merged Production Configuration Check ───────────────────────────────
console.log(`\n${colors.bold}STEP 2: Validating Merged Production docker-compose config syntax...${colors.reset}`);
let prodConfig = null;
try {
  // Set mock env variables for config render test
  const env = { 
    ...process.env, 
    DATABASE_URL: 'postgresql://santis:santis_secure_pass@postgres:5432/santis',
    POSTGRES_PASSWORD: 'santis_secure_pass'
  };
  const prodJson = execSync('docker compose -f compose.yml -f compose.prod.yml config --format json', { env }).toString();
  prodConfig = JSON.parse(prodJson);
  console.log(`  ${colors.green}✅ Merged production configuration syntax is valid.${colors.reset}`);
} catch (err) {
  console.error(`  ${colors.red}❌ Merged production configuration syntax is invalid: ${err.message}${colors.reset}`);
  failed = true;
}

// ── 3. Port Leakage Verification ────────────────────────────────────────────
if (prodConfig) {
  console.log(`\n${colors.bold}STEP 3: Auditing Postgres & Redis Port Exposure in Production Overlay...${colors.reset}`);
  
  const postgresService = prodConfig.services?.postgres;
  if (postgresService) {
    if (postgresService.ports && postgresService.ports.length > 0) {
      console.error(`  ${colors.red}❌ PORT LEAK DETECTED: Service 'postgres' exposes ports in production overlay!${colors.reset}`);
      console.error(JSON.stringify(postgresService.ports, null, 2));
      failed = true;
    } else {
      console.log(`  ${colors.green}✅ Service 'postgres' is isolated. No ports leaked.${colors.reset}`);
    }
  } else {
    console.warn(`  ${colors.yellow}⚠️  Service 'postgres' not found in merged configuration.${colors.reset}`);
  }

  const redisService = prodConfig.services?.redis;
  if (redisService) {
    if (redisService.ports && redisService.ports.length > 0) {
      console.error(`  ${colors.red}❌ PORT LEAK DETECTED: Service 'redis' exposes ports in production overlay!${colors.reset}`);
      console.error(JSON.stringify(redisService.ports, null, 2));
      failed = true;
    } else {
      console.log(`  ${colors.green}✅ Service 'redis' is isolated. No ports leaked.${colors.reset}`);
    }
  } else {
    console.warn(`  ${colors.yellow}⚠️  Service 'redis' not found in merged configuration.${colors.reset}`);
  }
}

console.log('─'.repeat(80));
if (!failed) {
  console.log(`\n${colors.green}${colors.bold}🛡️  [PASSED] Configuration & Port Leakage Audits completed successfully!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}${colors.bold}🚨  [FAILED] Configuration audit or port leakage check failed!${colors.reset}\n`);
  process.exit(1);
}
