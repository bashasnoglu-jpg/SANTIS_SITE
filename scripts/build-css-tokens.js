import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const manifestPath = path.join(ROOT, 'packages', 'design-system', 'theme-manifest.json');
const outputPath = path.join(ROOT, 'assets', 'css', 'tokens.css');
const checkMode = process.argv.includes('--check');

const TOKEN_SECTIONS = [
  'colors',
  'fontFamily',
  'fontSize',
  'typography',
  'spacing',
  'radius',
  'shadow',
  'surface',
  'zIndex',
  'opacity',
  'glow',
  'motion',
  'easing'
];

const LEGACY_ALIASES = [
  ['color-base-gold', '#D4AF37'],
  ['color-base-obsidian', '#1A1817'],
  ['color-base-ivory', '#F4F3F1'],
  ['color-base-cyan', '#00FFC2'],
  ['color-surface-primary', 'var(--color-base-obsidian)'],
  ['color-surface-secondary', '#202024'],
  ['color-surface-elevated', '#2A2A2A'],
  ['color-text-gold', 'var(--color-base-gold)'],
  ['color-text-soft', '#8F9095'],
  ['color-text-inverse', 'var(--color-base-ivory)'],
  ['color-border-soft', 'rgba(255, 255, 255, 0.06)'],
  ['color-border-muted', '#333333'],
  ['color-composite-gold-glow', 'rgba(212, 175, 55, 0.15)'],
  ['color-composite-gold-flash', 'rgba(212, 175, 55, 0.18)'],
  ['color-composite-gold-frame', 'rgba(212, 175, 55, 0.5)'],
  ['spacing-base-unit', '0.25rem'],
  ['spacing-container-gutter', '1.5rem'],
  ['spacing-container-edge', '1rem'],
  ['spacing-stack-xs', '0.5rem'],
  ['spacing-stack-md', '1.5rem'],
  ['spacing-stack-xl', '3rem'],
  ['breakpoint-mobile', '480px'],
  ['breakpoint-tablet', '769px'],
  ['breakpoint-desktop', '1200px'],
  ['motion-duration-liquid', '600ms'],
  ['motion-duration-instant', '200ms'],
  ['motion-easing-sovereign', 'cubic-bezier(0.22, 1, 0.36, 1)']
];

function kebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_.\s]+/g, '-')
    .toLowerCase();
}

function flattenTokens(input, prefix = []) {
  const tokens = [];

  Object.entries(input).forEach(([key, value]) => {
    const nextPrefix = [...prefix, kebabCase(key)];

    if (Array.isArray(value)) {
      tokens.push([nextPrefix.join('-'), value.join(', ')]);
      return;
    }

    if (value && typeof value === 'object') {
      tokens.push(...flattenTokens(value, nextPrefix));
      return;
    }

    tokens.push([nextPrefix.join('-'), String(value)]);
  });

  return tokens;
}

function buildCss(manifest) {
  const tokens = [];

  TOKEN_SECTIONS.forEach((section) => {
    if (manifest[section]) {
      tokens.push(...flattenTokens(manifest[section], [section]));
    }
  });

  return [
    '/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.',
    ' * Source: packages/design-system/theme-manifest.json',
    ' * Command: pnpm run tokens:css',
    ' */',
    '',
    ':root {',
    '  /* Legacy compatibility aliases retained for active CSS consumers. */',
    ...LEGACY_ALIASES.map(([name, value]) => `  --${name}: ${value};`),
    '',
    '  /* Manifest tokens. */',
    ...tokens.map(([name, value]) => `  --${name}: ${value};`),
    '}',
    ''
  ].join('\n');
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Theme manifest not found: ${path.relative(ROOT, manifestPath)}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const css = buildCss(manifest);

  if (checkMode) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';

    if (current !== css) {
      console.error('[tokens:css] assets/css/tokens.css is out of sync with theme-manifest.json.');
      process.exit(1);
    }

    console.log('[tokens:css] CSS tokens are synchronized.');
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, css, 'utf8');
  console.log(`[tokens:css] Generated ${path.relative(ROOT, outputPath).replace(/\\/g, '/')}`);
}

main();
