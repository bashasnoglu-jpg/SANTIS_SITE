#!/usr/bin/env node
import { spawn } from 'child_process';
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

console.log(`\n${colors.cyan}${colors.bold}🛡️  [Sovereign persistence] Initiating PostgreSQL Backup...${colors.reset}\n`);

// 1. Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 2. Generate timestamped filename
const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
const backupFilename = `santis_backup_${timestamp}.sql.gz`;
const backupFilePath = path.join(BACKUP_DIR, backupFilename);

console.log(`  Target backup location: ${colors.bold}${backupFilePath}${colors.reset}`);

// 3. Spawn pg_dump via docker compose exec -T
const writeStream = fs.createWriteStream(backupFilePath);
const gzip = zlib.createGzip();

const pgDumpArgs = [
  'compose',
  'exec',
  '-T',
  'postgres',
  'pg_dump',
  '-U',
  'santis',
  '-d',
  'santis'
];

console.log(`  Executing: docker ${pgDumpArgs.join(' ')}`);

const dumpProcess = spawn('docker', pgDumpArgs, { shell: true });

// Pipe dump stdout to Gzip, then to File Stream
dumpProcess.stdout.pipe(gzip).pipe(writeStream);

let stderrOutput = '';
dumpProcess.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

dumpProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n${colors.red}${colors.bold}🚨  Backup execution failed with exit code: ${code}${colors.reset}`);
    console.error(`  Error log:\n  ${stderrOutput}`);
    // Clean up empty/corrupted backup file
    if (fs.existsSync(backupFilePath)) {
      fs.unlinkSync(backupFilePath);
    }
    process.exit(1);
  }

  console.log(`\n${colors.green}✅  Backup successfully written and compressed: ${backupFilename}${colors.reset}`);
  
  // 4. Perform Backup Retention Rotation (Keep last 7 backups)
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

  console.log(`\n${colors.green}${colors.bold}🛡️  [PASSED] PostgreSQL Backup protocol executed successfully!${colors.reset}\n`);
  process.exit(0);
});
