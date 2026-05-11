import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const manifestPath = path.join(rootDir, 'packages/design-system/theme-manifest.json');
const outputPath = path.join(rootDir, 'assets/css/tokens.css');

function kebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_.\s]+/g, '-')
    .toLowerCase();
}

function flattenTokens(input, prefix = []) {
  const entries = [];

  Object.entries(input).forEach(([key, value]) => {
    const nextPrefix = [...prefix, kebabCase(key)];

    if (Array.isArray(value)) {
      entries.push([nextPrefix.join('-'), value.join(', ')]);
      return;
    }

    if (value && typeof value === 'object') {
      entries.push(...flattenTokens(value, nextPrefix));
      return;
    }

    entries.push([nextPrefix.join('-'), String(value)]);
  });

  return entries;
}

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ Theme manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const tokenSections = [
  'colors',
  'fontFamily',
  'fontSize',
  'typography',
  'spacing',
  'radius',
  'shadow',
  'zIndex',
  'opacity',
  'glow',
  'surface',
  'motion',
  'easing'
];

const tokens = [];

tokenSections.forEach(section => {
  if (!manifest[section]) return;
  tokens.push(...flattenTokens(manifest[section], [section]));
});

const css = [
  '/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.',
  ' * Source: packages/design-system/theme-manifest.json',
  ' * Command: pnpm run tokens:css',
  ' */',
  '',
  ':root {'
];

tokens.forEach(([name, value]) => {
  css.push(`  --${name}: ${value};`);
});

css.push('}', '');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, css.join('\n'), 'utf8');

console.log(`✅ CSS tokens generated: ${path.relative(rootDir, outputPath)}`);
