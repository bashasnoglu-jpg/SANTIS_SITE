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
  },
  { from: /shadow-\[#c6a96b\]/gi, to: 'shadow-accent-glow', kind: 'auto' },

  // Typography
  { from: /text-\[11px\]/g, to: 'text-micro', kind: 'auto' },

  // New dark backgrounds
  { from: /bg-\[#0a0908\]/gi, to: 'bg-sovereign-void', kind: 'auto' },
  { from: /bg-\[#141211\]/gi, to: 'bg-sovereign-coal', kind: 'auto' },
  { from: /bg-\[#1a1817\]/gi, to: 'bg-sovereign-obsidian', kind: 'auto' },
  { from: /bg-\[#080808\]/gi, to: 'bg-sovereign-graphite', kind: 'auto' },
  { from: /bg-\[#1a1a1a\]/gi, to: 'bg-sovereign-obsidian', kind: 'auto' },
  { from: /bg-\[#2a2a2a\]/gi, to: 'bg-sovereign-panel', kind: 'auto' },
  { from: /bg-\[#111\]/gi, to: 'bg-sovereign-graphite', kind: 'auto' },

  // New text colors
  { from: /text-\[#d4af37\]/gi, to: 'text-sovereign-gold-strong', kind: 'auto' },
  { from: /text-\[#c5a059\]/gi, to: 'text-sovereign-gold-deep', kind: 'auto' },
  { from: /text-\[#b5952f\]/gi, to: 'text-sovereign-gold-pressed', kind: 'auto' },
  { from: /text-\[#333\]/gi, to: 'text-sovereign-line', kind: 'auto' },
  { from: /text-\[#444\]/gi, to: 'text-sovereign-line-soft', kind: 'auto' },
  { from: /text-\[#222\]/gi, to: 'text-sovereign-graphite', kind: 'auto' },
  { from: /text-\[#ccc\]/gi, to: 'text-sovereign-neutral-400', kind: 'auto' },
  { from: /text-\[#ddd\]/gi, to: 'text-sovereign-neutral-300', kind: 'auto' },
  { from: /text-\[#eee\]/gi, to: 'text-sovereign-neutral-200', kind: 'auto' },
  { from: /text-\[#fff\]/gi, to: 'text-white', kind: 'auto' },

  // Borders
  { from: /border-\[#d4af37\]/gi, to: 'border-sovereign-gold-strong', kind: 'auto' },
  { from: /border-\[#c5a059\]/gi, to: 'border-sovereign-gold-deep', kind: 'auto' },
  { from: /border-\[#b5952f\]/gi, to: 'border-sovereign-gold-pressed', kind: 'auto' },
  { from: /border-\[#333\]/gi, to: 'border-sovereign-line', kind: 'auto' },
  { from: /border-\[#444\]/gi, to: 'border-sovereign-line-soft', kind: 'auto' },
  { from: /border-\[#ccc\]/gi, to: 'border-sovereign-neutral-400', kind: 'auto' },
  { from: /border-\[#ddd\]/gi, to: 'border-sovereign-neutral-300', kind: 'auto' },

  // Backgrounds: gold and neutrals
  { from: /bg-\[#d4af37\]/gi, to: 'bg-sovereign-gold-strong', kind: 'auto' },
  { from: /bg-\[#c5a059\]/gi, to: 'bg-sovereign-gold-deep', kind: 'auto' },
  { from: /bg-\[#b5952f\]/gi, to: 'bg-sovereign-gold-pressed', kind: 'auto' },
  { from: /bg-\[#333\]/gi, to: 'bg-sovereign-line', kind: 'auto' },
  { from: /bg-\[#444\]/gi, to: 'bg-sovereign-line-soft', kind: 'auto' },
  { from: /bg-\[#ccc\]/gi, to: 'bg-sovereign-neutral-400', kind: 'auto' },
  { from: /bg-\[#ddd\]/gi, to: 'bg-sovereign-neutral-300', kind: 'auto' },
  { from: /bg-\[#eee\]/gi, to: 'bg-sovereign-neutral-200', kind: 'auto' },
  { from: /bg-\[#fff\]/gi, to: 'bg-white', kind: 'auto' }
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
  { from: /#0a0a0b/gi, to: 'var(--sovereign-black)', kind: 'report-preferred' },

  { from: /#0a0908/gi, to: 'var(--sovereign-void)', kind: 'report-preferred' },
  { from: /#141211/gi, to: 'var(--sovereign-coal)', kind: 'report-preferred' },
  { from: /#1a1817/gi, to: 'var(--sovereign-obsidian)', kind: 'report-preferred' },
  { from: /#080808/gi, to: 'var(--sovereign-graphite)', kind: 'report-preferred' },
  { from: /#333333/gi, to: 'var(--sovereign-line)', kind: 'report-preferred' },
  { from: /#333\b/gi, to: 'var(--sovereign-line)', kind: 'report-preferred' },
  { from: /#444444/gi, to: 'var(--sovereign-line-soft)', kind: 'report-preferred' },
  { from: /#444\b/gi, to: 'var(--sovereign-line-soft)', kind: 'report-preferred' },
  { from: /#d4af37/gi, to: 'var(--sovereign-gold-strong)', kind: 'report-preferred' },
  { from: /#c5a059/gi, to: 'var(--sovereign-gold-deep)', kind: 'report-preferred' },
  { from: /#b5952f/gi, to: 'var(--sovereign-gold-pressed)', kind: 'report-preferred' },
  { from: /#ccc\b/gi, to: 'var(--sovereign-neutral-400)', kind: 'report-preferred' },
  { from: /#ddd\b/gi, to: 'var(--sovereign-neutral-300)', kind: 'report-preferred' },
  { from: /#eee\b/gi, to: 'var(--sovereign-neutral-200)', kind: 'report-preferred' },
  { from: /#fff\b/gi, to: 'var(--color-white)', kind: 'report-preferred' },
  { from: /#222\b/gi, to: 'var(--sovereign-graphite)', kind: 'report-preferred' }
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
