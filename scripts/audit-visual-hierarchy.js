import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CSS_ROOT = path.join(ROOT, 'assets', 'css');

const args = new Set(process.argv.slice(2));
const strictMode = args.has('--strict');
const jsonMode = args.has('--json');

const IGNORED_DIRS = new Set([
  'dist',
  'vendor',
  'node_modules'
]);

const IGNORED_FILES = new Set([
  'output.css',
  'santis-sovereign.css',
  'tokens.css'
]);

const RULES = [
  {
    id: 'VH_RAW_HEX',
    severity: 'P1',
    pattern: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
    message: 'Raw color literal found outside the token layer.'
  },
  {
    id: 'VH_EMERGENCY_Z_INDEX',
    severity: 'P0',
    pattern: /z-index\s*:\s*(?:9999|2147483647|[1-9]\d{3,})\b/g,
    message: 'Emergency z-index escapes the governed visual layer scale.'
  },
  {
    id: 'VH_IMPORTANT_OVERRIDE',
    severity: 'P1',
    pattern: /!important\b/g,
    message: 'Important override increases visual drift and should be governed.'
  },
  {
    id: 'VH_OVERSIZED_H2',
    severity: 'P1',
    pattern: /(?:h2|\.section-title|\.santis-section-title)[^{]*\{[^}]*font-size\s*:\s*(?:4\.[1-9]\d*|[5-9]\d*)(?:rem|px)/gs,
    message: 'Section title appears to exceed the VH-0 H2 hierarchy cap.'
  },
  {
    id: 'VH_RAW_TRANSITION_SECONDS',
    severity: 'P2',
    pattern: /(?:transition|animation)(?:-duration)?\s*:[^;]*\b\d*\.?\d+s\b/g,
    message: 'Raw motion duration found; prefer motion kernel tokens.'
  },
  {
    id: 'VH_RAW_BLUR',
    severity: 'P2',
    pattern: /blur\(\s*\d+(?:\.\d+)?px\s*\)/g,
    message: 'Raw blur value found; prefer visual hierarchy tokens.'
  },
  {
    id: 'VH_RAW_BOX_SHADOW',
    severity: 'P2',
    pattern: /box-shadow\s*:\s*(?!var\()[^;]+/g,
    message: 'Raw box-shadow found; prefer shadow orchestration tokens.'
  }
];

function toRelative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        files.push(...walk(fullPath));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.css') && !IGNORED_FILES.has(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function inspectFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (const rule of RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split(/\r?\n/).length;
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        file: toRelative(filePath),
        line,
        sample: lines[line - 1]?.trim() || match[0],
        message: rule.message
      });

      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
    }
  }

  return findings;
}

function summarize(findings) {
  return findings.reduce((summary, finding) => {
    summary[finding.severity] = (summary[finding.severity] || 0) + 1;
    return summary;
  }, { P0: 0, P1: 0, P2: 0 });
}

function main() {
  const files = walk(CSS_ROOT);
  const findings = files.flatMap(inspectFile);
  const summary = summarize(findings);
  const result = {
    status: findings.length ? (strictMode ? 'FAIL' : 'MEASURED') : 'PASS',
    strictMode,
    scannedFiles: files.length,
    summary,
    findings
  };

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[audit:visual-hierarchy] status=${result.status} scanned=${files.length} P0=${summary.P0} P1=${summary.P1} P2=${summary.P2}`);

    findings.slice(0, 40).forEach((finding) => {
      console.log(`- ${finding.severity} ${finding.rule} ${finding.file}:${finding.line}`);
      console.log(`  ${finding.message}`);
      console.log(`  ${finding.sample}`);
    });

    if (findings.length > 40) {
      console.log(`... ${findings.length - 40} additional findings omitted. Use --json for the full report.`);
    }
  }

  if (strictMode && findings.length) {
    process.exit(1);
  }
}

main();
