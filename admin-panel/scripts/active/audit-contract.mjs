#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

function fail(invariant, details) {
  console.error(`\n❌ [Sovereign Guard] ${invariant}`);
  for (const [key, value] of Object.entries(details)) {
    console.error(`   ${key}: ${value}`);
  }
  process.exitCode = 1;
}

console.log('🛡️  [Sovereign Guard] Auditing admin-panel contract...');

const REQUIRED_FILES = [
  'src/main.tsx',
  'vite.config.js',
  'tsconfig.json',
  'tailwind.config.js',
];

for (const rel of REQUIRED_FILES) {
  if (!existsSync(path.join(ROOT, rel))) {
    fail('CONTRACT_FILE_MISSING', {
      file: rel,
      fix: `Ensure ${rel} exists in admin-panel.`,
    });
  }
}

if (process.exitCode) {
  console.error('\n🚨 [Sovereign Guard] admin-panel contract audit failed.');
  process.exit(process.exitCode);
}

console.log('✅ [Sovereign Guard] admin-panel contract aligned.');
