#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m'
};

console.log(`\n${colors.cyan}${colors.bold}🛡️  [Sovereign Persistence] Initiating Controlled Maintenance Restore...${colors.reset}\n`);

// 1. Enforce Destructive Guard: SANTIS_RESTORE_CONFIRM=YES
if (process.env.SANTIS_RESTORE_CONFIRM !== 'YES') {
  console.error(`${colors.red}${colors.bold}🚨  DESTRUCTIVE OPERATION BLOCKED!${colors.reset}`);
  console.error(`  To execute this restore, you must explicitly set the confirmation variable:`);
  console.error(`  ${colors.bold}SANTIS_RESTORE_CONFIRM=YES node scripts/active/restore-db.mjs <backup_file>${colors.reset}\n`);
  process.exit(1);
}

const backupFileArg = process.argv[2];

// 2. Validate input argument
if (!backupFileArg) {
  console.error(`${colors.red}❌  Error: Missing backup file argument.${colors.reset}`);
  console.log(`  Usage: SANTIS_RESTORE_CONFIRM=YES node scripts/active/restore-db.mjs <path_to_backup_file.sql.gz>`);
  process.exit(1);
}

// 3. Resolve and prevent path traversal
const resolvedBackupPath = path.resolve(backupFileArg);
const backupsRoot = path.resolve(process.cwd(), 'backups');

if (!resolvedBackupPath.startsWith(backupsRoot)) {
  console.error(`${colors.red}❌  Error: Path traversal or unsafe backup path detected.${colors.reset}`);
  console.error(`  Backup files must reside strictly inside the './backups/' directory.`);
  process.exit(1);
}

// 4. Validate file existence and extension
if (!fs.existsSync(resolvedBackupPath)) {
  console.error(`${colors.red}❌  Error: Target backup file does not exist: ${resolvedBackupPath}${colors.reset}`);
  process.exit(1);
}

if (!backupFileArg.endsWith('.sql.gz')) {
  console.error(`${colors.red}❌  Error: Backup file must have '.sql.gz' extension.${colors.reset}`);
  process.exit(1);
}

console.log(`  Target backup file: ${colors.bold}${resolvedBackupPath}${colors.reset}`);

// 5. Run SHA256 Checksum Manifest verification if present
const checksumPath = `${resolvedBackupPath}.sha256`;
if (fs.existsSync(checksumPath)) {
  console.log(`  Verifying SHA256 checksum manifest...`);
  try {
    const expectedHash = fs.readFileSync(checksumPath, 'utf-8').trim();
    const fileBuffer = fs.readFileSync(resolvedBackupPath);
    const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    if (actualHash !== expectedHash) {
      console.error(`\n${colors.red}❌  Error: SHA256 checksum mismatch! The backup file is altered or corrupted.${colors.reset}`);
      console.error(`  Expected: ${expectedHash}`);
      console.error(`  Actual:   ${actualHash}`);
      process.exit(1);
    }
    console.log(`  ${colors.green}✅  SHA256 checksum manifest verified successfully.${colors.reset}`);
  } catch (hashErr) {
    console.error(`\n${colors.red}❌  Error during SHA256 verification: ${hashErr.message}${colors.reset}`);
    process.exit(1);
  }
} else {
  console.log(`  ⚠️  Warning: No SHA256 checksum manifest file found. Skipping checksum verification.`);
}

// 6. Run gzip integrity check before restore
console.log(`  Running gzip integrity validation...`);
try {
  execSync(`gzip -t "${resolvedBackupPath}"`, { stdio: 'ignore' });
  console.log(`  ${colors.green}✅  Gzip integrity validation passed (gzip -t).${colors.reset}`);
} catch (err) {
  try {
    const fileBuffer = fs.readFileSync(resolvedBackupPath);
    zlib.gunzipSync(fileBuffer);
    console.log(`  ${colors.green}✅  Gzip integrity validation passed (Node zlib verification).${colors.reset}`);
  } catch (zlibErr) {
    console.error(`\n${colors.red}❌  Error: Backup archive is corrupted or invalid! Restore aborted.${colors.reset}`);
    process.exit(1);
  }
}


// 6. Query container environment dynamically to fetch target user and DB
console.log(`\n${colors.yellow}🔄  Querying postgres container environment...${colors.reset}`);
let dbUser = 'santis';
let dbName = 'santis';
try {
  const envOutput = execSync('docker compose exec -T postgres env', { encoding: 'utf-8' });
  const envVars = {};
  envOutput.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
  if (envVars['POSTGRES_USER']) dbUser = envVars['POSTGRES_USER'];
  if (envVars['POSTGRES_DB']) dbName = envVars['POSTGRES_DB'];
  
  console.log(`  Detected target database: ${colors.bold}${dbName}${colors.reset}`);
  console.log(`  Detected target owner user: ${colors.bold}${dbUser}${colors.reset}`);
} catch (err) {
  console.warn(`  ⚠️  Warning: Failed to fetch container environment. Using defaults (user: santis, db: santis).`);
}

// 7. Terminate active target DB connections using postgres maintenance DB
console.log(`\n${colors.yellow}🔄  Step 1: Dropping active connections to database '${dbName}'...${colors.reset}`);
try {
  const terminateQuery = `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();`;
  execSync(`docker compose exec -T postgres psql -U "${dbUser}" -d postgres -c "${terminateQuery}"`, { stdio: 'inherit' });
  console.log(`  ${colors.green}✅  Connections terminated successfully.${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}❌  Error: Connection termination failed: ${err.message}${colors.reset}`);
  process.exit(1);
}

// 8. DROP & CREATE target DB while connected to postgres maintenance DB
console.log(`\n${colors.yellow}🔄  Step 2: Performing drop and recreate of database '${dbName}'...${colors.reset}`);
try {
  execSync(`docker compose exec -T postgres psql -U "${dbUser}" -d postgres -c "DROP DATABASE IF EXISTS ${dbName};"`, { stdio: 'inherit' });
  execSync(`docker compose exec -T postgres psql -U "${dbUser}" -d postgres -c "CREATE DATABASE ${dbName} OWNER ${dbUser};"`, { stdio: 'inherit' });
  console.log(`  ${colors.green}✅  Clean slate database created successfully.${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}❌  Error: Database drop/recreation failed: ${err.message}${colors.reset}`);
  process.exit(1);
}

// 9. Stream gunzip decompression into target container psql
console.log(`\n${colors.yellow}🔄  Step 3: Restoring database schema and records...${colors.reset}`);

const psqlArgs = [
  'compose',
  'exec',
  '-T',
  'postgres',
  'psql',
  '-U',
  dbUser,
  '-d',
  dbName
];

const psqlProcess = spawn('docker', psqlArgs, { shell: true });
const readStream = fs.createReadStream(resolvedBackupPath);
const gunzipStream = zlib.createGunzip();

// Pipe file stream -> Gunzip -> psql stdin
readStream.pipe(gunzipStream).pipe(psqlProcess.stdin);

let stderrOutput = '';
psqlProcess.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

psqlProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n${colors.red}${colors.bold}🚨  Restore failed with exit code: ${code}${colors.reset}`);
    console.error(`  Error log:\n  ${stderrOutput}`);
    process.exit(1);
  }

  // 10. Execute schema verification check
  console.log(`\n${colors.yellow}🔄  Step 4: Executing database recovery check...${colors.reset}`);
  try {
    execSync(`docker compose exec -T postgres psql -U "${dbUser}" -d "${dbName}" -c "SELECT 1;"`, { stdio: 'inherit' });
    console.log(`  ${colors.green}✅  Verification query returned OK.${colors.reset}`);
  } catch (err) {
    console.error(`  ${colors.red}❌  Database verification failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.green}${colors.bold}🛡️  [PASSED] PostgreSQL database restored successfully!${colors.reset}\n`);
  process.exit(0);
});
