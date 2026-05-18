import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const TARGET_DIRS = [
  'assets/js/modules'
];

const IGNORED_FILES = [
  'santis-bootloader.js'
];

const REFLOW_PROPERTIES = [
  'offsetWidth',
  'offsetHeight',
  'clientWidth',
  'clientHeight',
  'scrollWidth',
  'scrollHeight',
  'scrollTop',
  'scrollLeft',
  'getBoundingClientRect',
  'getComputedStyle'
];

console.log('[SANTIS_RVS_AUDIT] Starting Layout Reflow Telemetry Audit...');

let hasViolations = false;
let scannedFilesCount = 0;
let violationsCount = 0;

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js') && !IGNORED_FILES.includes(entry.name)) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  scannedFilesCount++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    // Strip inline single-line and block comments for rule checking
    const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').trim();
    if (!cleanLine) return;

    for (const prop of REFLOW_PROPERTIES) {
      if (cleanLine.includes(prop)) {
        // Safe if wrapped in SantisDOM.read/SantisDOM.write or explicitly bypassed
        const isSafe = cleanLine.includes('SantisDOM.read') || 
                       cleanLine.includes('SantisDOM.write') ||
                       line.includes('@bypass-reflow') || 
                       line.includes('@allow-reflow') ||
                       line.includes('@bypass-rvs');

        if (!isSafe) {
          const relativePath = path.relative(ROOT_DIR, filePath);
          console.error(`[VIOLATION] Unprotected layout reflow trigger '${prop}' found in ${relativePath}:${lineIndex + 1}`);
          console.error(`  > Line ${lineIndex + 1}: ${line.trim()}`);
          console.error(`  Fix: Wrap it in SantisDOM.read() or add // @bypass-reflow if absolutely necessary.`);
          hasViolations = true;
          violationsCount++;
        }
      }
    }
  });
}

for (const targetDir of TARGET_DIRS) {
  scanDirectory(path.join(ROOT_DIR, targetDir));
}

console.log(`\n[SANTIS_RVS_AUDIT] Scanned ${scannedFilesCount} files.`);

const STRICT_MODE = process.argv.includes("--strict");

if (hasViolations) {
  console.error(
    `[WARN] Layout Reflow Telemetry Audit found ${violationsCount} unprotected forced reflow candidates.`
  );
  console.warn(
    `NOTE: This scanner is currently line-based. Block-level wrapping (e.g. multi-line SantisDOM.read) may trigger false positives unless bypassed with // @bypass-reflow.`
  );

  if (STRICT_MODE) {
    console.error("[FAILED] Strict mode enabled. Failing audit.");
    process.exit(1);
  }

  console.log("[ADVISORY] RVS layout reflow audit completed in advisory mode.");
  process.exit(0);
}

console.log("[PASSED] Layout Reflow Telemetry Audit passed. All reflow triggers are properly governed.");
process.exit(0);
