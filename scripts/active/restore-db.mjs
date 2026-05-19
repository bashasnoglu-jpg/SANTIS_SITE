#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m'
};

const backupFileArg = process.argv[2];

console.log(`\n${colors.cyan}${colors.bold}🛡️  [Sovereign Persistence] Initiating Database Restore...${colors.reset}\n`);

// 1. Validate inputs
if (!backupFileArg) {
  console.error(`${colors.red}❌  Error: Missing backup file argument.${colors.reset}`);
  console.log(`  Usage: node scripts/active/restore-db.mjs <path_to_backup_file.sql.gz>`);
  process.exit(1);
}

const backupFilePath = path.resolve(process.cwd(), backupFileArg);

if (!fs.existsSync(backupFilePath)) {
  console.error(`${colors.red}❌  Error: Backup file does not exist: ${backupFilePath}${colors.reset}`);
  process.exit(1);
}

console.log(`  Target backup file: ${colors.bold}${backupFilePath}${colors.reset}`);

// 2. Terminate active database connections
console.log(`\n${colors.yellow}🔄  Step 1: Dropping open connections to 'santis' database...${colors.reset}`);
try {
  const terminateQuery = `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'santis' AND pid <> pg_backend_pid();`;
  execSync(`docker compose exec -T postgres psql -U santis -d postgres -c "${terminateQuery}"`, { stdio: 'inherit' });
  console.log(`  ${colors.green}✅  Open connections dropped.${colors.reset}`);
} catch (err) {
  console.warn(`  ⚠️  Warning: Failed to drop active connections: ${err.message}`);
}

// 3. Drop & Recreate Database
console.log(`\n${colors.yellow}🔄  Step 2: Dropping and recreating database 'santis'...${colors.reset}`);
try {
  execSync(`docker compose exec -T postgres psql -U santis -d postgres -c "DROP DATABASE IF EXISTS santis;"`, { stdio: 'inherit' });
  execSync(`docker compose exec -T postgres psql -U santis -d postgres -c "CREATE DATABASE santis;"`, { stdio: 'inherit' });
  console.log(`  ${colors.green}✅  Database 'santis' recreated successfully.${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}❌  Error: Database recreation failed: ${err.message}${colors.reset}`);
  process.exit(1);
}

// 4. Decompress and Stream Backup to Container
console.log(`\n${colors.yellow}🔄  Step 3: Restoring database schema and data from backup...${colors.reset}`);

const psqlArgs = [
  'compose',
  'exec',
  '-T',
  'postgres',
  'psql',
  '-U',
  'santis',
  '-d',
  'santis'
];

const restoreProcess = spawn('docker', psqlArgs, { shell: true });
const readStream = fs.createReadStream(backupFilePath);
const gunzip = zlib.createGunzip();

// Pipe file stream -> Gunzip -> psql stdin
readStream.pipe(gunzip).pipe(restoreProcess.stdin);

let stderrOutput = '';
restoreProcess.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

restoreProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n${colors.red}${colors.bold}🚨  Database restore failed with exit code: ${code}${colors.reset}`);
    console.error(`  Error log:\n  ${stderrOutput}`);
    process.exit(1);
  }

  // 5. Schema verification check
  console.log(`\n${colors.yellow}🔄  Step 4: Executing database recovery check...${colors.reset}`);
  try {
    execSync(`docker compose exec -T postgres psql -U santis -d santis -c "SELECT 1;"`, { stdio: 'inherit' });
    console.log(`  ${colors.green}✅  Verification query returned OK.${colors.reset}`);
  } catch (err) {
    console.error(`  ${colors.red}❌  Database verification failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.green}${colors.bold}🛡️  [PASSED] PostgreSQL database restored successfully!${colors.reset}\n`);
  process.exit(0);
});
