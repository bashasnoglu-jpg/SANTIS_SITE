#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const MAX_BACKUPS = 7;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`\n${colors.cyan}${colors.bold}🛡️  [Sovereign Persistence] Initiating PostgreSQL Online Backup...${colors.reset}\n`);

// 1. Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 2. Generate timestamped filename: santis_backup_YYYYMMDD_HHMMSS.sql.gz
const now = new Date();
const pad = (num) => String(num).padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
                  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const backupFilename = `santis_backup_${timestamp}.sql.gz`;
const backupFilePath = path.join(BACKUP_DIR, backupFilename);

console.log(`  Target backup location: ${colors.bold}${backupFilePath}${colors.reset}`);

// 3. Query container environment dynamically to fetch target user and DB
console.log(`\n  Querying postgres container environment...`);
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

// 4. Spawn pg_dump directly without shell/escaping issues
const writeStream = fs.createWriteStream(backupFilePath);
const gzipStream = zlib.createGzip();

const pgDumpArgs = [
  'compose',
  'exec',
  '-T',
  'postgres',
  'pg_dump',
  '-U',
  dbUser,
  '-d',
  dbName,
  '--no-owner',
  '--no-privileges'
];

console.log(`  Executing: docker ${pgDumpArgs.join(' ')}`);

const dumpProcess = spawn('docker', pgDumpArgs);

// Pipe stdout -> Gzip -> File Stream
dumpProcess.stdout.pipe(gzipStream).pipe(writeStream);

let stderrOutput = '';
dumpProcess.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

dumpProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n${colors.red}${colors.bold}🚨  Backup execution failed with exit code: ${code}${colors.reset}`);
    console.error(`  Error log:\n  ${stderrOutput}`);
    if (fs.existsSync(backupFilePath)) {
      fs.unlinkSync(backupFilePath);
    }
    process.exit(1);
  }

  // 5. Validate file exists and size > 0
  if (!fs.existsSync(backupFilePath)) {
    console.error(`\n${colors.red}❌  Error: Backup file was not created.${colors.reset}`);
    process.exit(1);
  }

  const fileStats = fs.statSync(backupFilePath);
  if (fileStats.size === 0) {
    console.error(`\n${colors.red}❌  Error: Backup file is empty (0 bytes).${colors.reset}`);
    fs.unlinkSync(backupFilePath);
    process.exit(1);
  }

  console.log(`  File size: ${(fileStats.size / 1024).toFixed(2)} KB`);

  // 6. Run gzip integrity check
  console.log(`  Verifying file integrity...`);
  try {
    execSync(`gzip -t "${backupFilePath}"`, { stdio: 'ignore' });
    console.log(`  ${colors.green}✅  Gzip integrity check passed (native gzip -t).${colors.reset}`);
  } catch (err) {
    try {
      const fileBuffer = fs.readFileSync(backupFilePath);
      zlib.gunzipSync(fileBuffer);
      console.log(`  ${colors.green}✅  Gzip integrity check passed (Node zlib verification).${colors.reset}`);
    } catch (zlibErr) {
      console.error(`\n${colors.red}❌  Error: Gzip integrity check failed! The backup file is corrupted.${colors.reset}`);
      console.error(`  ${zlibErr.message}`);
      if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
      process.exit(1);
    }
  }

  console.log(`\n${colors.green}✅  Backup successfully written and compressed: ${backupFilename}${colors.reset}`);

  // 7. Perform Backup Retention Rotation (Keep last 7 backups)
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('santis_backup_') && f.endsWith('.sql.gz'))
      .map(f => ({ name: f, path: path.join(BACKUP_DIR, f), time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time); // Newest first

    if (files.length > MAX_BACKUPS) {
      console.log(`\n${colors.cyan}🔄  Rotating backups (Retaining last ${MAX_BACKUPS} copies)...${colors.reset}`);
      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`  Deleted expired backup: ${file.name}`);
      }
    }
  } catch (err) {
    console.warn(`  ⚠️  Warning: Backup rotation failed: ${err.message}`);
  }

  console.log(`\n${colors.green}${colors.bold}🛡️  [PASSED] PostgreSQL Online Backup protocol executed successfully!${colors.reset}\n`);
  process.exit(0);
});
