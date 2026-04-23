const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const TARGET_DIRS = [
  path.join(ROOT, 'admin-panel', 'src')
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

const violations = [];

const RULES = [
  {
    id: 'RAW_HEX',
    description: 'Raw hex color kullanımı yasak.',
    regex: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
  },
  {
    id: 'ARBITRARY_BG',
    description: 'Tailwind arbitrary bg-[...] kullanımı yasak.',
    regex: /\bbg-\[[^\]]+\]/g
  },
  {
    id: 'ARBITRARY_TEXT',
    description: 'Tailwind arbitrary text-[...] kullanımı yasak.',
    regex: /\btext-\[[^\]]+\]/g
  },
  {
    id: 'ARBITRARY_BORDER',
    description: 'Tailwind arbitrary border-[...] kullanımı yasak.',
    regex: /\bborder-\[[^\]]+\]/g
  },
  {
    id: 'ARBITRARY_PADDING',
    description: 'Tailwind arbitrary p-[...] / px-[...] / py-[...] kullanımı yasak.',
    regex: /\b(?:p|px|py|pt|pr|pb|pl)-\[[^\]]+\]/g
  },
  {
    id: 'ARBITRARY_MARGIN',
    description: 'Tailwind arbitrary m-[...] / mx-[...] / my-[...] kullanımı yasak.',
    regex: /\b(?:m|mx|my|mt|mr|mb|ml)-\[[^\]]+\]/g
  },
  {
    id: 'ARBITRARY_RADIUS',
    description: 'Tailwind arbitrary rounded-[...] kullanımı yasak.',
    regex: /\brounded-\[[^\]]+\]/g
  },
  {
    id: 'ARBITRARY_SHADOW',
    description: 'Tailwind arbitrary shadow-[...] kullanımı yasak.',
    regex: /\bshadow-\[[^\]]+\]/g
  },
  {
    id: 'ARBITRARY_W_H',
    description: 'Tailwind arbitrary w-[...] / h-[...] kullanımı yasak.',
    regex: /\b(?:w|h|min-w|min-h|max-w|max-h)-\[[^\]]+\]/g
  }
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

    inspectFile(fullPath);
  }
}

function inspectFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  RULES.forEach((rule) => {
    lines.forEach((line, index) => {
      const matches = line.match(rule.regex);
      if (!matches) return;

      matches.forEach((match) => {
        violations.push({
          filePath,
          line: index + 1,
          ruleId: rule.id,
          description: rule.description,
          match
        });
      });
    });
  });
}

function main() {
  TARGET_DIRS.forEach(walk);

  if (violations.length > 0) {
    console.error('\x1b[31m[stitch:guard] Visual Truth ihlali bulundu:\n\x1b[0m');

    violations.forEach((v) => {
      console.error(
        `- ${v.ruleId} | ${v.filePath}:${v.line} | ${v.match}\n  ${v.description}`
      );
    });

    console.error(`\x1b[31m\nToplam ihlal: ${violations.length}\x1b[0m`);
    process.exit(1);
  }

  console.log('\x1b[32m[stitch:guard] Kaçak stil bulunmadı. Anayasa güvende.\x1b[0m');
}

main();
