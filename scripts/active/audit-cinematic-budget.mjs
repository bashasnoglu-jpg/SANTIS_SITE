import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const JS_DIRS = [
  'assets/js/modules',
  'assets/js/core'
];

const CSS_DIRS = [
  'assets/css'
];

const EXCLUDED_FILES = [
  'santis-bootloader.js',
  'output.css',
  'tailwind-input.css',
  'input.css'
];

const EXCLUDED_DIRS = [
  'dist',
  'vendor'
];

console.log('[SANTIS_RVS_BUDGET] Starting Cinematic Render Budget Scan...');

let hasViolations = false;
let scannedJsCount = 0;
let scannedCssCount = 0;
let violationsCount = 0;

// Helper to check if file/path is ignored
function isIgnored(filePath) {
  const filename = path.basename(filePath);
  if (EXCLUDED_FILES.includes(filename)) return true;

  const parts = filePath.split(path.sep);
  return parts.some(part => EXCLUDED_DIRS.includes(part));
}

// 1. SCAN JS FILES
function scanJsDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanJsDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js') && !isIgnored(fullPath)) {
      scanJsFile(fullPath);
    }
  }
}

function scanJsFile(filePath) {
  scannedJsCount++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    // Strip comments to check logic safely
    const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').trim();
    if (!cleanLine) return;

    // A. Check for requestAnimationFrame
    if (cleanLine.includes('requestAnimationFrame') && !line.includes('@bypass-budget') && !line.includes('SantisDOM')) {
      logViolation(filePath, lineIndex + 1, 'requestAnimationFrame', 'Ungoverned animation loop detected. Animation frames must be scheduled through window.SantisDOM or marked with // @bypass-budget.');
    }

    // B. Check for setInterval
    if (cleanLine.includes('setInterval') && !line.includes('@bypass-budget')) {
      logViolation(filePath, lineIndex + 1, 'setInterval', 'setInterval animation/ticker detected. Timers bypass the rendering budget. Use requestAnimationFrame or SantisDOM.');
    }

    // C. Check for setTimeout used for loops
    if (cleanLine.includes('setTimeout') && (cleanLine.includes('loop') || cleanLine.includes('animate') || cleanLine.includes('render')) && !line.includes('@bypass-budget')) {
      logViolation(filePath, lineIndex + 1, 'setTimeout', 'setTimeout-based animation loop detected. Use governed SantisDOM schedulers.');
    }

    // D. Check for Particle Density limit > 300
    const particleMatch = cleanLine.match(/(particleCount|maxParticles|PARTICLE_LIMIT|particlesLimit)\s*=\s*(\d+)/i);
    if (particleMatch) {
      const count = parseInt(particleMatch[2], 10);
      if (count > 300 && !line.includes('@bypass-budget')) {
        logViolation(filePath, lineIndex + 1, 'particle-density-exceeded', `Excessive particle count detected (${count} particles). Santis OS budget limit is 300 particles to protect GPU memory.`);
      }
    }
  });
}

// 2. SCAN CSS FILES
function scanCssDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanCssDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.css') && !isIgnored(fullPath)) {
      scanCssFile(fullPath);
    }
  }
}

function scanCssFile(filePath) {
  scannedCssCount++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').trim();
    if (!cleanLine) return;

    // A. Check for transition: all
    if ((cleanLine.includes('transition:') && cleanLine.includes('all')) || cleanLine.includes('transition-property: all') || cleanLine.includes('transition-all')) {
      if (!line.includes('@bypass-budget') && !line.includes('@allow-transition-all')) {
        logViolation(filePath, lineIndex + 1, 'transition-all', 'transition: all property detected. This triggers layout recalculations for all properties. Specify transitions explicitly.');
      }
    }

    // B. Check for excessive will-change
    if (cleanLine.includes('will-change') && !line.includes('@bypass-budget')) {
      // Warn on will-change to prevent memory bloating
      logViolation(filePath, lineIndex + 1, 'will-change', 'will-change rule detected. Compositor layers must be managed defensively. Ensure it is cleaned up or bypass with // @bypass-budget.');
    }

    // C. Check for expensive filter/backdrop-filter
    if ((cleanLine.includes('backdrop-filter') || cleanLine.includes('filter:')) && !line.includes('@bypass-budget')) {
      logViolation(filePath, lineIndex + 1, 'heavy-gpu-filter', 'Expensive GPU filter/backdrop-filter detected. Use sparingly to maintain cinematic 60FPS.');
    }
  });
}

function logViolation(filePath, lineNo, rule, description) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  console.error(`[BUDGET VIOLATION] [${rule}] in ${relativePath}:${lineNo}`);
  console.error(`  > Line ${lineNo}: ${fs.readFileSync(filePath, 'utf-8').split('\n')[lineNo - 1].trim()}`);
  console.error(`  Reason: ${description}`);
  hasViolations = true;
  violationsCount++;
}

// Execute Scans
for (const dir of JS_DIRS) scanJsDirectory(path.join(ROOT_DIR, dir));
for (const dir of CSS_DIRS) scanCssDirectory(path.join(ROOT_DIR, dir));

console.log(`\n[SANTIS_RVS_BUDGET] Scan Completed.`);
console.log(`- Scanned JS files: ${scannedJsCount}`);
console.log(`- Scanned CSS files: ${scannedCssCount}`);

const STRICT_MODE = process.argv.includes('--strict');

if (hasViolations) {
  console.error(`\n[WARN] Render Budget Scan found ${violationsCount} potential rendering bottlenecks.`);
  console.warn('NOTE: This scanner is line-based. False positives can be bypassed using // @bypass-budget.');

  if (STRICT_MODE) {
    console.error('[FAILED] Strict mode enabled. Failing audit.');
    process.exit(1);
  }

  console.log('[ADVISORY] Cinematic render budget scan completed in advisory mode.');
  process.exit(0);
}

console.log('[PASSED] Cinematic render budget scan passed. All elements respect governed rendering standards.');
process.exit(0);
