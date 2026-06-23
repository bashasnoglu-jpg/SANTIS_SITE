import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = [
  'scripts/ops/export-airtable-backup.mjs',
  'scripts/ops/generate-offline-daily-schedule.mjs',
  '.gitignore',
  'package.json',
];

const OPS_FILES = [
  'scripts/ops/export-airtable-backup.mjs',
  'scripts/ops/generate-offline-daily-schedule.mjs',
];

const FRONTEND_ROOTS = [
  'admin-panel/src',
  'assets/js',
];

const OUTPUT_PATTERNS = [
  'Santis_OS_Backups/',
  'Santis_OS_Offline_Schedule/',
  'offline-schedule/',
  'backups/',
];

const FORBIDDEN_FRONTEND_PATTERNS = [
  'AIRTABLE_PAT',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_SANTIS_BASE_ID',
  'api.airtable.com',
  'Authorization: `Bearer',
  'Authorization: "Bearer',
  "Authorization: 'Bearer",
];

const FORBIDDEN_WRITE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

let failed = false;

function fail(message) {
  failed = true;
  console.error(`❌ ${message}`);
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function readFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function requireIncludes(content, pattern, label) {
  if (!content.includes(pattern)) {
    fail(`${label} is missing required pattern: ${pattern}`);
    return;
  }
  pass(`${label} contains ${pattern}`);
}

function requireNotIncludes(content, pattern, label) {
  if (content.includes(pattern)) {
    fail(`${label} contains forbidden pattern: ${pattern}`);
    return;
  }
  pass(`${label} does not contain ${pattern}`);
}

function collectFiles(dir) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];

  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.next', '.turbo'].includes(entry.name)) continue;
      files.push(...collectFiles(relative));
    } else if (/\.(js|jsx|ts|tsx|mjs|cjs|html)$/.test(entry.name)) {
      files.push(relative);
    }
  }

  return files;
}

function assertNoWriteMethods(content, label) {
  for (const method of FORBIDDEN_WRITE_METHODS) {
    const literalPatterns = [
      `method: '${method}'`,
      `method: "${method}"`,
      `method:'${method}'`,
      `method:"${method}"`,
    ];

    for (const pattern of literalPatterns) {
      requireNotIncludes(content, pattern, label);
    }
  }
}

for (const file of REQUIRED_FILES) {
  readFile(file);
}

const packageJson = readFile('package.json');
const gitignore = readFile('.gitignore');
const backupScript = readFile('scripts/ops/export-airtable-backup.mjs');
const scheduleScript = readFile('scripts/ops/generate-offline-daily-schedule.mjs');

requireIncludes(packageJson, '"ops:backup:airtable": "node scripts/ops/export-airtable-backup.mjs"', 'package.json');
requireIncludes(packageJson, '"ops:offline-schedule": "node scripts/ops/generate-offline-daily-schedule.mjs"', 'package.json');
requireIncludes(packageJson, '"audit:ops-backup-safety": "node scripts/audit-ops-backup-safety.js"', 'package.json');
requireIncludes(packageJson, 'pnpm run audit:ops-backup-safety', 'package.json audit:all');

for (const pattern of OUTPUT_PATTERNS) {
  requireIncludes(gitignore, pattern, '.gitignore');
}

for (const file of OPS_FILES) {
  const content = readFile(file);
  requireIncludes(content, 'mode: \'read-only\'', file);
  requireIncludes(content, 'method: \'GET\'', file);
  requireIncludes(content, 'Accept: \'application/json\'', file);
  assertNoWriteMethods(content, file);
}

for (const requiredTable of ['Bookings', 'Clients', 'Payments', 'Inventory']) {
  requireIncludes(backupScript, requiredTable, 'scripts/ops/export-airtable-backup.mjs');
}

for (const scheduleField of [
  'Booking ID',
  'Client name',
  'Client phone',
  'Service',
  'Therapist',
  'Room',
  'Payment status',
  'Balance due',
]) {
  requireIncludes(scheduleScript, scheduleField, 'scripts/ops/generate-offline-daily-schedule.mjs');
}

for (const frontendRoot of FRONTEND_ROOTS) {
  for (const file of collectFiles(frontendRoot)) {
    const content = readFile(file);
    for (const pattern of FORBIDDEN_FRONTEND_PATTERNS) {
      requireNotIncludes(content, pattern, file);
    }
  }
}

for (const generatedRoot of ['Santis_OS_Backups', 'Santis_OS_Offline_Schedule', 'offline-schedule']) {
  if (fs.existsSync(path.join(ROOT, generatedRoot))) {
    fail(`Generated output directory must not be present in repository checkout: ${generatedRoot}`);
  } else {
    pass(`Generated output directory is absent from repository checkout: ${generatedRoot}`);
  }
}

if (failed) {
  console.error('❌ Ops backup safety audit failed.');
  process.exit(1);
}

console.log('✅ Ops backup safety audit passed.');
