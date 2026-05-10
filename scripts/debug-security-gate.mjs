import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps', 'packages', 'src', 'admin-panel', 'docs', 'core'];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md']);
const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
const patterns = [
  { label: 'Wildcard CORS origin detected', regex: /origin\s*:\s*['"]\*['"]/ },
  { label: 'Wildcard Access-Control-Allow-Origin detected', regex: /Access-Control-Allow-Origin['"]?\s*[:,]\s*['"]\*/ },
  { label: 'Unsafe Zod passthrough detected', regex: /\.passthrough\(\)/ }
];
const violations = [];

function extensionOf(filePath) {
  const match = filePath.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function walk(path) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    const dirName = path.split(/[\\/]/).pop();
    if (ignoredDirs.has(dirName)) return;
    for (const entry of readdirSync(path)) {
      walk(join(path, entry));
    }
    return;
  }

  if (!stats.isFile() || !allowedExtensions.has(extensionOf(path))) return;

  const content = readFileSync(path, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        violations.push(`${path}:${index + 1}: ${pattern.label}`);
      }
    }
  });
}

for (const root of roots) {
  if (existsSync(root)) walk(root);
}

if (violations.length > 0) {
  console.error('Sovereign Guard security checks failed.');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Sovereign Guard security checks passed.');
