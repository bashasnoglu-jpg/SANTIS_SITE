#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m'
};

console.log(`\n${colors.cyan}${colors.bold}🛡️  [Sovereign Cloud] Initiating Offsite Backup Sync Protocol...${colors.reset}\n`);

// 1. Check if backups folder exists
if (!fs.existsSync(BACKUP_DIR)) {
  console.log(`  No backup directory found at: ${BACKUP_DIR}`);
  console.log(`  Nothing to synchronize.\n`);
  process.exit(0);
}

// 2. Scan backups directory
const files = fs.readdirSync(BACKUP_DIR);
const backups = files.filter(f => f.startsWith('santis_backup_') && f.endsWith('.sql.gz'));

if (backups.length === 0) {
  console.log(`  No PostgreSQL backup archives found inside './backups/'.`);
  console.log(`  Nothing to synchronize.\n`);
  process.exit(0);
}

console.log(`  Found ${backups.length} local backup archive(s) for synchronization.`);

// 3. Validate matching SHA256 manifests and verify hashes locally before upload
const validatedBackups = [];
for (const backup of backups) {
  const backupPath = path.join(BACKUP_DIR, backup);
  const checksumFilename = `${backup}.sha256`;
  const checksumPath = path.join(BACKUP_DIR, checksumFilename);

  console.log(`\n  🔍  Inspecting backup: ${colors.bold}${backup}${colors.reset}`);

  // Check matching checksum file
  if (!fs.existsSync(checksumPath)) {
    console.error(`  ${colors.red}❌  Error: Missing SHA256 checksum manifest file: ${checksumFilename}${colors.reset}`);
    console.error(`      Sync aborted to prevent unverified data uploads.`);
    process.exit(1);
  }

  // Pre-sync SHA256 Integrity Verification
  try {
    const expectedHash = fs.readFileSync(checksumPath, 'utf-8').trim();
    const fileBuffer = fs.readFileSync(backupPath);
    const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (actualHash !== expectedHash) {
      console.error(`  ${colors.red}❌  Error: Local SHA256 checksum mismatch! File has been altered or corrupted.${colors.reset}`);
      console.error(`      Expected: ${expectedHash}`);
      console.error(`      Actual:   ${actualHash}`);
      process.exit(1);
    }

    console.log(`    ${colors.green}✅  SHA256 Match: ${actualHash}${colors.reset}`);
    validatedBackups.push({
      archiveName: backup,
      archivePath: backupPath,
      checksumName: checksumFilename,
      checksumPath: checksumPath,
      hash: actualHash
    });
  } catch (err) {
    console.error(`  ${colors.red}❌  Error reading files for validation: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

// 4. Require offsite destination target parameters
const provider = process.env.SANTIS_OFFSITE_PROVIDER; // e.g. R2, S3, B2
const bucket = process.env.SANTIS_OFFSITE_BUCKET;     // Bucket name
const prefix = process.env.SANTIS_OFFSITE_PREFIX || 'db-backups';

if (!provider || !bucket) {
  console.error(`\n${colors.red}❌  Missing Required Offsite Target Parameters!${colors.reset}`);
  console.log(`  Please set the following environment variables:`);
  console.log(`  - ${colors.bold}SANTIS_OFFSITE_PROVIDER${colors.reset} (e.g. AWS_S3, CLOUDFLARE_R2, BACKBLAZE_B2)`);
  console.log(`  - ${colors.bold}SANTIS_OFFSITE_BUCKET${colors.reset}   (e.g. santis-vault-prod)`);
  console.log(`  - ${colors.bold}SANTIS_OFFSITE_PREFIX${colors.reset}   (e.g. production/backups - default: db-backups)\n`);
  process.exit(1);
}

const isConfirmed = process.env.SANTIS_OFFSITE_SYNC_CONFIRM === 'YES';

if (!isConfirmed) {
  console.log(`\n${colors.yellow}${colors.bold}🧪  [DRY-RUN MODE ACTIVE] (SANTIS_OFFSITE_SYNC_CONFIRM is not set to YES)${colors.reset}`);
  console.log(`  Target Provider: ${colors.bold}${provider}${colors.reset}`);
  console.log(`  Target Bucket:   ${colors.bold}${bucket}${colors.reset}`);
  console.log(`  Target Prefix:   ${colors.bold}${prefix}${colors.reset}`);
  console.log(`\n  Planned Synchronization Operations:`);
} else {
  console.log(`\n${colors.green}${colors.bold}🚀  [PRODUCTION SYNC ACTIVE] Executing uploads...${colors.reset}`);
  console.log(`  Target Provider: ${colors.bold}${provider}${colors.reset}`);
  console.log(`  Target Bucket:   ${colors.bold}${bucket}${colors.reset}`);
  console.log(`  Target Prefix:   ${colors.bold}${prefix}${colors.reset}`);
}

// 5. Generate and execute provider commands
for (const item of validatedBackups) {
  const remoteArchiveKey = `${prefix}/${item.archiveName}`;
  const remoteChecksumKey = `${prefix}/${item.checksumName}`;

  let archiveUploadCmd = '';
  let checksumUploadCmd = '';

  // Select optimal upload commands depending on configured target provider
  switch (provider.toUpperCase()) {
    case 'CLOUDFLARE_R2':
      archiveUploadCmd = `wrangler r2 object put ${bucket}/${remoteArchiveKey} --file="${item.archivePath}"`;
      checksumUploadCmd = `wrangler r2 object put ${bucket}/${remoteChecksumKey} --file="${item.checksumPath}"`;
      break;
    case 'AWS_S3':
      archiveUploadCmd = `aws s3 cp "${item.archivePath}" s3://${bucket}/${remoteArchiveKey} --metadata sha256=${item.hash}`;
      checksumUploadCmd = `aws s3 cp "${item.checksumPath}" s3://${bucket}/${remoteChecksumKey}`;
      break;
    case 'BACKBLAZE_B2':
      archiveUploadCmd = `b2 upload-file "${bucket}" "${item.archivePath}" "${remoteArchiveKey}"`;
      checksumUploadCmd = `b2 upload-file "${bucket}" "${item.checksumPath}" "${remoteChecksumKey}"`;
      break;
    default:
      archiveUploadCmd = `aws s3 cp "${item.archivePath}" s3://${bucket}/${remoteArchiveKey} --endpoint-url="https://${provider}.compat.objectstorage.com"`;
      checksumUploadCmd = `aws s3 cp "${item.checksumPath}" s3://${bucket}/${remoteChecksumKey} --endpoint-url="https://${provider}.compat.objectstorage.com"`;
  }

  if (!isConfirmed) {
    // DRY-RUN printout
    console.log(`\n  👉  ${colors.bold}Upload Archive:${colors.reset} ${item.archiveName}`);
    console.log(`      Command: ${colors.cyan}${archiveUploadCmd}${colors.reset}`);
    console.log(`  👉  ${colors.bold}Upload Checksum Manifest:${colors.reset} ${item.checksumName}`);
    console.log(`      Command: ${colors.cyan}${checksumUploadCmd}${colors.reset}`);
  } else {
    // Real Execution
    console.log(`\n  Uploading ${item.archiveName}...`);
    try {
      execSync(archiveUploadCmd, { stdio: 'inherit' });
      execSync(checksumUploadCmd, { stdio: 'inherit' });
      console.log(`  ${colors.green}✅  Successfully synchronized ${item.archiveName} & checksum manifest offsite.${colors.reset}`);
    } catch (err) {
      console.error(`  ${colors.red}❌  Error executing offsite sync command: ${err.message}${colors.reset}`);
      console.error(`      Please ensure the corresponding CLI client is installed and authenticated.`);
      process.exit(1);
    }
  }
}

if (!isConfirmed) {
  console.log(`\n${colors.yellow}💡  Dry-run complete. To execute real synchronization, run with:${colors.reset}`);
  console.log(`  ${colors.bold}SANTIS_OFFSITE_SYNC_CONFIRM=YES SANTIS_OFFSITE_PROVIDER=${provider} SANTIS_OFFSITE_BUCKET=${bucket} pnpm run db:sync-offsite${colors.reset}\n`);
} else {
  console.log(`\n${colors.green}${colors.bold}🛡️  [PASSED] PostgreSQL Backup Offsite Sync completed successfully!${colors.reset}\n`);
}

process.exit(0);
