const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const TARGET_DIRS = [
  path.join(ROOT, 'admin-panel', 'src', 'components', 'dashboard'),
  path.join(ROOT, 'admin-panel', 'src', 'pages'),
  path.join(ROOT, 'admin-panel', 'src', 'components')
];

const TARGET_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const IGNORE_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]);

const touchedFiles = new Set();
const reportOnlyFindings = [];
let autoFixedCount = 0;

const REPLACEMENTS = [
  // Background color arbitrary -> token
  { from: /bg-\[#c6a96b\]/gi, to: 'bg-sovereign-gold', kind: 'auto' },
  { from: /bg-\[#141416\]/gi, to: 'bg-sovereign-dark', kind: 'auto' },
  { from: /bg-\[#202024\]/gi, to: 'bg-sovereign-surface', kind: 'auto' },
  { from: /bg-\[#0a0a0a\]/gi, to: 'bg-sovereign-black', kind: 'auto' },
  { from: /bg-\[#0a0a0b\]/gi, to: 'bg-sovereign-black', kind: 'auto' },
  { from: /bg-\[#e5e0d8\]/gi, to: 'bg-sovereign-ink', kind: 'auto' },
  { from: /bg-\[#857b74\]/gi, to: 'bg-sovereign-bronze', kind: 'auto' },
  { from: /bg-\[#c2a878\]/gi, to: 'bg-sovereign-accent', kind: 'auto' },
  { from: /bg-\[#b7ada1\]/gi, to: 'bg-sovereign-sand', kind: 'auto' },
  { from: /bg-\[#6e5946\]/gi, to: 'bg-sovereign-earth', kind: 'auto' },
  { from: /bg-\[#2a2624\]/gi, to: 'bg-sovereign-panel', kind: 'auto' },

  // Text color arbitrary -> token
  { from: /text-\[#c6a96b\]/gi, to: 'text-sovereign-gold', kind: 'auto' },
  { from: /text-\[#d6d6d8\]/gi, to: 'text-sovereign-text', kind: 'auto' },
  { from: /text-\[#8f9095\]/gi, to: 'text-sovereign-muted', kind: 'auto' },
  { from: /text-\[#e5e0d8\]/gi, to: 'text-sovereign-ink', kind: 'auto' },
  { from: /text-\[#857b74\]/gi, to: 'text-sovereign-bronze', kind: 'auto' },
  { from: /text-\[#c2a878\]/gi, to: 'text-sovereign-accent', kind: 'auto' },
  { from: /text-\[#b7ada1\]/gi, to: 'text-sovereign-sand', kind: 'auto' },
  { from: /text-\[#6e5946\]/gi, to: 'text-sovereign-earth', kind: 'auto' },
  { from: /text-\[#0a0a0a\]/gi, to: 'text-sovereign-black', kind: 'auto' },
  { from: /text-\[#0a0a0b\]/gi, to: 'text-sovereign-black', kind: 'auto' },

  // Border color arbitrary -> token
  { from: /border-\[#c6a96b\]/gi, to: 'border-sovereign-gold', kind: 'auto' },
  { from: /border-\[#2a2624\]/gi, to: 'border-sovereign-panel', kind: 'auto' },
  { from: /border-\[#6e5946\]/gi, to: 'border-sovereign-earth', kind: 'auto' },
  { from: /border-\[#c2a878\]/gi, to: 'border-sovereign-accent', kind: 'auto' },

  // Font size arbitrary -> token
  { from: /text-\[10px\]/g, to: 'text-2xs', kind: 'auto' },

  // Known shadow patterns -> token
  {
    from: /shadow-\[0_0_8px_#c2a878\]/gi,
    to: 'shadow-accent-glow',
    kind: 'auto'
  },
  {
    from: /shadow-\[0_0_10px_#d4af37\]/gi,
    to: 'shadow-accent-glow',
    kind: 'auto'
  }
];

// Raw hex replacements outside className strings are deliberately conservative.
// These mostly target inline config objects or string literals that are obvious color values.
const RAW_HEX_REPLACEMENTS = [
  { from: /#c6a96b/gi, to: 'var(--sovereign-gold)', kind: 'report-preferred' },
  { from: /#141416/gi, to: 'var(--sovereign-dark)', kind: 'report-preferred' },
  { from: /#202024/gi, to: 'var(--sovereign-surface)', kind: 'report-preferred' },
  { from: /#e5e0d8/gi, to: 'var(--sovereign-ink)', kind: 'report-preferred' },
  { from: /#857b74/gi, to: 'var(--sovereign-bronze)', kind: 'report-preferred' },
  { from: /#c2a878/gi, to: 'var(--sovereign-accent)', kind: 'report-preferred' },
  { from: /#b7ada1/gi, to: 'var(--sovereign-sand)', kind: 'report-preferred' },
  { from: /#6e5946/gi, to: 'var(--sovereign-earth)', kind: 'report-preferred' },
  { from: /#2a2624/gi, to: 'var(--sovereign-panel)', kind: 'report-preferred' },
  { from: /#0a0a0a/gi, to: 'var(--sovereign-black)', kind: 'report-preferred' },
  { from: /#0a0a0b/gi, to: 'var(--sovereign-black)', kind: 'report-preferred' }
];

// Risky layout utilities: never auto-fix
const REPORT_ONLY_PATTERNS = [
  { id: 'ARBITRARY_WIDTH_HEIGHT', regex: /\b(?:w|h|min-w|min-h|max-w|max-h)-\[[^\]]+\]/g },
  { id: 'ARBITRARY_MARGIN', regex: /\b(?:m|mx|my|mt|mr|mb|ml)-\[[^\]]+\]/g },
  { id: 'ARBITRARY_PADDING', regex: /\b(?:p|px|py|pt|pr|pb|pl)-\[[^\]]+\]/g },
  { id: 'ARBITRARY_RADIUS', regex: /\brounded-\[[^\]]+\]/g },
  { id: 'ARBITRARY_COMPLEX_SHADOW', regex: /\bshadow-\[[^\]]+\]/g },
  { id: 'RAW_HEX', regex: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g }
];

function shouldIgnoreDir(dirName) {
  return IGNORE_DIR_NAMES.has(dirName);
}

function walk(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (shouldIgnoreDir(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!TARGET_EXTENSIONS.has(ext)) continue;

    cleanFile(fullPath);
  }
}

function applyReplacementSet(content, replacements) {
  let next = content;
  let count = 0;

  for (const rule of replacements) {
    next = next.replace(rule.from, (match) => {
      count += 1;
      return rule.to;
    });
  }

  return { content: next, count };
}

function recordReportOnly(filePath, content) {
  const lines = content.split(/\r?\n/);

  REPORT_ONLY_PATTERNS.forEach((pattern) => {
    lines.forEach((line, index) => {
      const matches = line.match(pattern.regex);
      if (!matches) return;

      matches.forEach((match) => {
        reportOnlyFindings.push({
          filePath,
          line: index + 1,
          ruleId: pattern.id,
          match
        });
      });
    });
  });
}

function cleanFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  let current = original;

  // 1) Safe class replacements
  const classPass = applyReplacementSet(current, REPLACEMENTS);
  current = classPass.content;

  // 2) Deliberately do NOT auto-fix raw hex globally.
  //    We only report them because many are inside chart config, inline style, SVG props, etc.
  //    Those need semantic/manual review.
  //    If you later want a stricter secondary mode, we can add --unsafe-inline-color-fix.

  const fixedInThisFile = classPass.count;

  if (current !== original) {
    fs.writeFileSync(filePath, current, 'utf8');
    touchedFiles.add(filePath);
    autoFixedCount += fixedInThisFile;
  }

  recordReportOnly(filePath, current);
}

function uniqueReportOnly(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.filePath}:${item.line}:${item.ruleId}:${item.match}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function main() {
  TARGET_DIRS.forEach(walk);

  const uniqueFindings = uniqueReportOnly(reportOnlyFindings);

  console.log(`\x1b[36m[stitch:clean] Auto-fixed: ${autoFixedCount}\x1b[0m`);
  console.log(`\x1b[36m[stitch:clean] Touched files: ${touchedFiles.size}\x1b[0m`);

  if (touchedFiles.size > 0) {
    Array.from(touchedFiles)
      .sort()
      .forEach((file) => console.log(`  - ${file}`));
  }

  console.log(`\x1b[33m[stitch:clean] Report-only findings: ${uniqueFindings.length}\x1b[0m`);

  if (uniqueFindings.length > 0) {
    console.log('\x1b[33m[stitch:clean] Remaining manual review items:\x1b[0m');
    uniqueFindings.slice(0, 200).forEach((item) => {
      console.log(`  - ${item.ruleId} | ${item.filePath}:${item.line} | ${item.match}`);
    });

    if (uniqueFindings.length > 200) {
      console.log(`  ... ${uniqueFindings.length - 200} more`);
    }
  }
}

main();
